import { createReadStream, createWriteStream, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { FileManager, ReplicationLevel } from '@storagehub-sdk/core';
import { TypeRegistry } from '@polkadot/types';
import { AccountId20, H256, Hash } from '@polkadot/types/interfaces';
import { storageHubClient, address, publicClient, polkadotApi, account } from '../services/clientService.js';
import { mspClient, getMspInfo, authenticateUser } from '../services/mspService.js';
import { DownloadResult } from '@storagehub-sdk/msp-client';

function extractPeerIDs(multiaddresses: string[]): string[] {
  return (multiaddresses ?? []).map((addr) => addr.split('/p2p/').pop()).filter((id): id is string => !!id);
}

export async function uploadFile(bucketId: string, filePath: string, fileName: string) {
  // Setup FileManager
  const fileSize = statSync(filePath).size;
  const fileManager = new FileManager({
    size: fileSize,
    stream: () => Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>,
  });

  // Get file details
  const fingerprint = await fileManager.getFingerprint();
  const fileSizeBigInt = BigInt(fileManager.getFileSize());
  console.log(`File size: ${fileSize} bytes`);
  console.log(`Fingerprint: ${fingerprint.toHex()}`);

  // Get MSP info
  const { mspId, multiaddresses } = await getMspInfo();
  if (!multiaddresses?.length) {
    throw new Error('MSP multiaddresses are missing');
  }
  const peerIds: string[] = extractPeerIDs(multiaddresses);
  if (peerIds.length === 0) {
    throw new Error('MSP multiaddresses had no /p2p/<peerId> segment');
  }

  // Issue storage request
  const txHash: `0x${string}` | undefined = await storageHubClient.issueStorageRequest(
    bucketId as `0x${string}`,
    fileName,
    fingerprint.toHex() as `0x${string}`,
    fileSizeBigInt,
    mspId as `0x${string}`,
    peerIds,
    ReplicationLevel.Custom,
    1
  );
  console.log('issueStorageRequest() txHash:', txHash);
  if (!txHash) {
    throw new Error('issueStorageRequest() did not return a transaction hash');
  }

  // Wait for storage request transaction
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== 'success') {
    throw new Error(`Storage request failed: ${txHash}`);
  }

  // Compute file key
  const registry = new TypeRegistry();
  const owner = registry.createType('AccountId20', account.address) as AccountId20;
  const bucketIdH256 = registry.createType('H256', bucketId) as H256;
  const fileKey = await fileManager.computeFileKey(owner, bucketIdH256, fileName);

  // Verify storage request on chain
  const storageRequest = await polkadotApi.query.fileSystem.storageRequests(fileKey);
  if (!storageRequest.isSome) {
    throw new Error('Storage request not found on chain');
  }

  // Read the storage request data
  const storageRequestData = storageRequest.unwrap();
  console.log('Storage request data:', storageRequestData);
  console.log('Storage request bucketId:', storageRequestData.bucketId.toString());
  console.log(
    'Storage request fingerprint should be the same as initial fingerprint',
    storageRequestData.fingerprint.toString() === fingerprint.toString()
  );

  // Authenticate bucket owner address with MSP prior to uploading file
  const authProfile = await authenticateUser();
  console.log('Authenticated user profile:', authProfile);

  // Upload file to MSP
  const uploadReceipt = await mspClient.files.uploadFile(
    bucketId,
    fileKey.toHex(),
    await fileManager.getFileBlob(),
    address,
    fileName
  );
  console.log('File upload receipt:', uploadReceipt);

  if (uploadReceipt.status !== 'upload_successful') {
    throw new Error('File upload to MSP failed');
  }

  // // TEMPORARY: Fetch and log bucket info after file upload
  // const bucketInfo = await mspClient.buckets.getBucket(bucketId);
  // console.log('Bucket Info:', bucketInfo);

  return { fileKey, uploadReceipt };
}

export async function downloadFile(fileKey: H256, downloadPath: string): Promise<string> {
  const downloadResponse: DownloadResult = await mspClient.files.downloadFile(fileKey.toHex());

  if (downloadResponse.status !== 200) {
    throw new Error(`Download failed with status: ${downloadResponse.status}`);
  }

  // Save downloaded file
  const writeStream = createWriteStream(downloadPath);
  const readableStream = Readable.fromWeb(downloadResponse.stream as any);

  return new Promise((resolve, reject) => {
    readableStream.pipe(writeStream);
    writeStream.on('finish', () => resolve(downloadPath));
    writeStream.on('error', reject);
  });
}

export async function verifyDownload(originalPath: string, downloadedPath: string): Promise<boolean> {
  const originalBuffer = await import('node:fs/promises').then((fs) => fs.readFile(originalPath));
  const downloadedBuffer = await import('node:fs/promises').then((fs) => fs.readFile(downloadedPath));

  return originalBuffer.equals(downloadedBuffer);
}

export async function deleteFile(bucketId: string, fileKey: H256) {
  // Request file deletion
  const txHash: `0x${string}` = await storageHubClient.requestDeleteFile(bucketId as `0x${string}`, fileKey.toHex());
  console.log('deleteFile() txHash:', txHash);

  // Wait for delete file transaction receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== 'success') {
    throw new Error(`File deletion failed: ${txHash}`);
  }

  console.log(`File with key ${fileKey.toHex()} deleted successfully from bucket ${bucketId}`);
}
