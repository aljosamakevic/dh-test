import { createReadStream, createWriteStream, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { FileManager, ReplicationLevel } from '@storagehub-sdk/core';
import { TypeRegistry } from '@polkadot/types';
import { AccountId20, H256 } from '@polkadot/types/interfaces';
import { storageHubClient, address, publicClient, substrateApi, account } from '../services/clientService.js';
import { mspClient, getMspInfo } from '../services/mspService.js';
import { DEMO_CONFIG } from '../config/demoConfig.js';

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
  console.log(`   File size: ${fileSize} bytes`);
  console.log(`   Fingerprint: ${fingerprint.toHex()}`);

  // Get MSP info
  const { mspId, multiaddresses } = await getMspInfo();
  // TO ASK Is this how I'm supposed to do this part?
  //   const peerIds = (multiaddresses || [])
  //   .map((addr: string) => addr.split("/p2p/").pop())
  //   .filter(Boolean);

  // Issue storage request
  const txHash = await storageHubClient.issueStorageRequest(
    bucketId as `0x${string}`,
    fileName,
    fingerprint.toHex() as `0x${string}`,
    fileSizeBigInt,
    mspId as `0x${string}`,
    multiaddresses,
    ReplicationLevel.Basic,
    DEMO_CONFIG.replicas
  );

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
  const storageRequest = await substrateApi.query.fileSystem.storageRequests(fileKey);
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

  // Upload file to MSP
  const uploadReceipt = await mspClient.uploadFile(
    bucketId,
    fileKey.toHex(),
    await fileManager.getFileBlob(),
    address,
    fileName
  );

  if (uploadReceipt.status !== 'success') {
    throw new Error('File upload to MSP failed');
  }

  return { fileKey, uploadReceipt };

  // Wait until the MSP has received and stored the file
  //   const hexFileKey = fileKey.toHex();
  //   TO ASK - is this step necessary? and if so what's the way to do it since .wait.fileStorageComplete doesn't exist
  //   await mspClient.wait.fileStorageComplete(hexFileKey);

  // TO ASK - .wait.mspResponseInTxPool doesn't exist either
  //   await userApi.wait.mspResponseInTxPool(1);

  // TO ASK - same with assert.eventPresent
  //     const mspAcceptedStorageRequestEvent = await userApi.assert.eventPresent(
  //     'fileSystem',
  //     'MspAcceptedStorageRequest',
  //   );
  // ...
}

export async function downloadFile(fileKey: H256, downloadPath: string): Promise<string> {
  const downloadResponse = await mspClient.downloadByKey(fileKey.toHex());

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

  //   const downloadFileBlob = await new Response(downloadResponse.stream).blob();

  //   const isDownloadedFileTheSame =
  //     Buffer.from(await downloadFileBlob.arrayBuffer()) ===
  //     Buffer.from(await (await fileManager.getFileBlob()).arrayBuffer());
  //   console.log('Is downloaded file the same as the uploaded one?', isDownloadedFileTheSame);

  //   // Saving the downloaded file to verify it's correct
  //   const downloadPath = new URL('../files/papermoon_logo_downloaded.jpeg', import.meta.url).pathname;
  //   const writeStream = createWriteStream(downloadPath);
  //   const readableStream = Readable.fromWeb(downloadResponse.stream as any);
  //   readableStream.pipe(writeStream);
  //   console.log('Downloaded file saved to:', downloadPath);
}

export async function verifyDownload(originalPath: string, downloadedPath: string): Promise<boolean> {
  const originalBuffer = await import('node:fs/promises').then((fs) => fs.readFile(originalPath));
  const downloadedBuffer = await import('node:fs/promises').then((fs) => fs.readFile(downloadedPath));

  return originalBuffer.equals(downloadedBuffer);
}
