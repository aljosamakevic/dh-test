import 'dotenv/config';
import '@storagehub/api-augment';
import { createReadStream, createWriteStream, statSync } from 'node:fs';
import { FileManager, initWasm, ReplicationLevel } from '@storagehub-sdk/core';
import { TypeRegistry } from '@polkadot/types';
import { AccountId20, H256 } from '@polkadot/types/interfaces';
import {
  Bucket,
  UploadReceipt,
  type InfoResponse,
  type StatsResponse,
  type ValueProp,
} from '@storagehub-sdk/msp-client';

import { Readable } from 'node:stream';

import { mspClient } from './services/mspService.js';
import { storageHubClient, address, publicClient, account, polkadotApi } from './services/clientService.js';

const main = async () => {
  await initWasm();

  throw new Error("WARNING don't run the indexFlat.ts script - it is outdated. Use index.ts instead until updated.");

  //   CREATE BUCKET
  // Derive bucket ID
  const bucketName = 'bucket-001';
  const bucketId = (await storageHubClient.deriveBucketId(address, bucketName)) as string;
  console.log('Derived bucket Id: ', bucketId);
  // Check that the bucket doesn't exist yet
  const bucketBeforeCreation = await polkadotApi.query.providers.buckets(bucketId);
  console.log('Bucket before creation is empty', bucketBeforeCreation.isEmpty);

  // Get MSP info
  const mspInfo: InfoResponse = await mspClient.getInfo();
  //   console.log('MSP Info:', mspInfo);
  const mspId = mspInfo.mspId as `0x${string}`;
  console.log('MSP id:', mspId);

  //   get MSP Value props
  const valueProps: ValueProp[] = await mspClient.getValueProps();
  if (!Array.isArray(valueProps) || valueProps.length === 0) {
    throw new Error('No value props availabile from this MSP.');
  }
  const valuePropId = valueProps[0].id as `0x${string}`;
  console.log('Chosen value prop id: ', valuePropId);

  // Create the bucket on chain
  const txHashBucket = await storageHubClient.createBucket(mspId, bucketName, false, valuePropId);
  console.log('Bucket created in tx:', txHashBucket);

  // Wait for the transaction to be mined
  const receiptBucket = await publicClient.waitForTransactionReceipt({ hash: txHashBucket });
  if (receiptBucket.status !== 'success') {
    throw new Error(`Create bucket transaction failed: ${txHashBucket}`);
  }
  console.log('Bucket created receipt:', receiptBucket);

  // Check that the bucket now exists on chain
  const bucketAfterCreation = await polkadotApi.query.providers.buckets(bucketId);
  console.log('Bucket after creation exists', !bucketAfterCreation.isEmpty);

  const bucketData = bucketAfterCreation.unwrap();
  console.log('Bucket data:', bucketData);
  console.log('Bucket userId:', bucketData.userId.toString());
  console.log('Bucket mspId:', bucketData.mspId.toString());
  console.log('Bucket mspId matches initial mspId', bucketData.mspId.toString() === mspId);

  // ISSUE STORAGE REQUEST
  // Setting up the FileManager instance
  const filePath = new URL('../files/papermoon_logo.jpeg', import.meta.url).pathname;
  const fileSize = statSync(filePath).size;
  const fileManager: FileManager = new FileManager({
    size: fileSize,
    stream: () => Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>,
  });

  // Compute file fingerprint and other details needed for the storage request
  const fingerprint = await fileManager.getFingerprint();
  console.log('File fingerprint:', fingerprint);
  const fileSizeBigInt = BigInt(fileManager.getFileSize());
  const peerIds = mspInfo.multiaddresses;
  // TO ASK Is this how I'm supposed to do this part?
  //   const peerIds = (mspInfo.multiaddresses || [])
  //   .map((addr: string) => addr.split("/p2p/").pop())
  //   .filter(Boolean);
  const fileLocation = 'papermoon_logo.jpeg';
  const replicationLevel = ReplicationLevel.Basic;
  const replicas = 0;

  const txHashStorageRequest = await storageHubClient.issueStorageRequest(
    bucketId as `0x${string}`,
    fileLocation,
    fingerprint.toHex() as `0x${string}`,
    fileSizeBigInt,
    mspId,
    peerIds,
    replicationLevel,
    replicas
  );
  console.log('Storage request created in tx:', txHashStorageRequest);

  const receiptStorageRequest = await publicClient.waitForTransactionReceipt({ hash: txHashStorageRequest });
  if (receiptStorageRequest.status !== 'success') {
    throw new Error(`Storage request transaction failed: ${txHashStorageRequest}`);
  }
  console.log('Storage request created receipt:', receiptStorageRequest);

  // VERIFY STORAGE REQUEST IS ON CHAIN
  // Compute the file key
  const registry = new TypeRegistry();
  const owner = registry.createType('AccountId20', account.address) as AccountId20;
  const bucketIdH256 = registry.createType('H256', bucketId) as H256;
  const fileKey: H256 = await fileManager.computeFileKey(owner, bucketIdH256, fileLocation);

  // Check that the storage request exists on chain
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

  // UPLOAD THE FILE TO THE MSP

  const uploadReceipt: UploadReceipt = await mspClient.uploadFile(
    bucketId,
    fileKey.toHex(),
    await fileManager.getFileBlob(),
    address,
    fileLocation
  );
  console.log('Uploaded:', uploadReceipt);
  if (uploadReceipt.status !== 'success') {
    throw new Error('File upload failed');
  }

  console.log('File uploaded successfully with fileKey:', uploadReceipt.fileKey);

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

  // DOWNLOAD THE FILE FROM THE MSP
  const downloadResponse = await mspClient.downloadByKey(fileKey.toHex());
  console.log('downloadResponse status', downloadResponse.status);
  console.log('downloadResponse', downloadResponse);

  const downloadFileBlob = await new Response(downloadResponse.stream).blob();

  const isDownloadedFileTheSame =
    Buffer.from(await downloadFileBlob.arrayBuffer()) ===
    Buffer.from(await (await fileManager.getFileBlob()).arrayBuffer());
  console.log('Is downloaded file the same as the uploaded one?', isDownloadedFileTheSame);

  // Saving the downloaded file to verify it's correct
  const downloadPath = new URL('../files/papermoon_logo_downloaded.jpeg', import.meta.url).pathname;
  const writeStream = createWriteStream(downloadPath);
  const readableStream = Readable.fromWeb(downloadResponse.stream as any);
  readableStream.pipe(writeStream);
  console.log('Downloaded file saved to:', downloadPath);

  await polkadotApi.disconnect();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
