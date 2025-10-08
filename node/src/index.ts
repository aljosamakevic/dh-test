import 'dotenv/config';
import '@storagehub/api-augment';
import { assert, ethers } from 'ethers';
import { privateKeyToAccount } from 'viem/accounts';
import { createReadStream, createWriteStream, statSync } from 'node:fs';
import { createPublicClient, createWalletClient, defineChain, http } from 'viem';
import {
  FileManager,
  HttpClientConfig,
  initWasm,
  LocalWallet,
  ReplicationLevel,
  StorageHubClient,
} from '@storagehub-sdk/core';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';
import { AccountId20, H256 } from '@polkadot/types/interfaces';
import { types as BundledTypes } from '@storagehub/types-bundle';
import {
  Bucket,
  MspClient,
  UploadReceipt,
  VerifyResponse,
  type InfoResponse,
  type StatsResponse,
  type ValueProp,
} from '@storagehub-sdk/msp-client';

import { chainInfo } from '../data/chainInfo.js';
import { Readable } from 'node:stream';

const main = async () => {
  await initWasm();

  const httpCfg: HttpClientConfig = { baseUrl: chainInfo.baseUrl };
  const mspClient = await MspClient.connect(httpCfg);

  //   const provider = new ethers.JsonRpcProvider(chainInfo.rpcUrl, {
  //     chainId: chainInfo.id,
  //     name: chainInfo.name,
  //   });

  //   let wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  //   const wallet = LocalWallet.fromPrivateKey(process.env.PRIVATE_KEY!);
  //   const address = await wallet.getAddress();
  //   console.log('Using address:', address);

  const chain = defineChain({
    id: chainInfo.id,
    name: chainInfo.name,
    nativeCurrency: { name: 'Have', symbol: 'HAVE', decimals: 18 },
    rpcUrls: { default: { http: [chainInfo.rpcUrl] } },
  });

  // viem wallet client
  const account = privateKeyToAccount(process.env.PRIVATE_KEY! as `0x${string}`);
  const address = account.address;
  //   console.log('Using address:', address);
  const walletClient = createWalletClient({ chain, account, transport: http(chainInfo.rpcUrl) });
  const publicClient = createPublicClient({ chain, transport: http(chainInfo.rpcUrl) });

  const storageHubClient = new StorageHubClient({
    rpcUrl: chainInfo.rpcUrl,
    chain: chain,
    walletClient: walletClient,
    filesystemContractAddress: '0x0000000000000000000000000000000000000404' as `0x${string}`,
  });

  const provider = new WsProvider(chainInfo.wsUrl);
  const userApi = await ApiPromise.create({
    provider,
    typesBundle: BundledTypes,
    noInitWarn: true,
  });

  // MSP info endpoints
  const mspInfo: InfoResponse = await mspClient.getInfo();
  //   console.log('MSP Info:', mspInfo);
  const mspId = mspInfo.mspId as `0x${string}`;
  console.log('MSP id:', mspId);

  //   const health = await mspClient.getHealth();
  //   console.log('MSP service health:', health);
  //   const stats: StatsResponse = await mspClient.getStats();
  //   console.log('MSP Stats:', stats);
  //   const valueProps: ValueProp[] = await mspClient.getValuePropositions();
  //   console.log('MSP ValueProps count:', Array.isArray(valueProps) ? valueProps.length : 0);
  //   console.log('MSP ValueProps:', valueProps.length > 0 ? valueProps : 'no value props found');

  //   const nonce = await mspClient.getNonce(address, chainInfo.id);
  //   console.log('Full message', nonce);
  //   const { message } = await mspClient.getNonce(address, chainInfo.id);
  //   console.log('message', message);

  //   const signature = await walletClient.signMessage({ message });
  //   console.log('signature', signature);

  //   const verified: VerifyResponse = await mspClient.verify(message, signature);
  //   console.log('verified', verified);

  //   mspClient.setToken(verified.token);
  //   console.log('Verified user', verified.user);

  //   get Value props
  const valueProps: ValueProp[] = await mspClient.getValuePropositions();
  if (!Array.isArray(valueProps) || valueProps.length === 0) {
    throw new Error('No value props availabile from this MSP.');
  }
  //   console.log('MSP ValueProps: ', valueProps);

  const valuePropId = valueProps[0].id as `0x${string}`;
  console.log('Chosen value prop id: ', valuePropId);

  //   create bucket
  //   const bucketName = 'init-bucket';
  const bucketName = 'b1';
  const bucketId = (await storageHubClient.deriveBucketId(address, bucketName)) as string;
  console.log('Derived bucket Id: ', bucketId);

  //   const bucketIdExample = '0xf431e4c82e225eed8fb11671e4dbabbb747f7127bf226f2a4886023471afeb9a';
  const bucketBeforeCreation = await userApi.query.providers.buckets(bucketId);
  console.log('Bucket before creation is empty', bucketBeforeCreation.isEmpty);

  const txHashBucket = await storageHubClient.createBucket(mspId, bucketName, false, valuePropId);
  console.log('Bucket created in tx:', txHashBucket);

  const receiptBucket = await publicClient.waitForTransactionReceipt({ hash: txHashBucket });
  if (receiptBucket.status !== 'success') {
    throw new Error(`Create bucket transaction failed: ${txHashBucket}`);
  }
  console.log('Bucket created receipt:', receiptBucket);

  const bucketAfterCreation = await userApi.query.providers.buckets(bucketId);
  console.log('Bucket after creation exists', !bucketAfterCreation.isEmpty);
  const bucketData = bucketAfterCreation.unwrap();
  console.log('Bucket data:', bucketData);
  console.log('Bucket userId:', bucketData.userId.toString());
  //   TO DO compare values here
  console.log('Bucket mspId:', bucketData.mspId.toString());
  console.log('Bucket mspId matches initial mspId', bucketData.mspId.toString() === mspId);

  // Setting up the FileManager instance

  const filePath = new URL('../files/papermoon_logo.jpeg', import.meta.url).pathname;
  const fileSize = statSync(filePath).size;
  // console.log('File size:', fileSize);
  const fileManager: FileManager = new FileManager({
    size: fileSize,
    stream: () => Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>,
  });
  const fileLocation = 'papermoon_logo.jpeg';

  const fingerprint = await fileManager.getFingerprint();
  console.log('File fingerprint:', fingerprint);
  const fileSizeBigInt = BigInt(fileManager.getFileSize());
  const peerIds = mspInfo.multiaddresses;
  // TO ASK Is this how I'm supposed to do this part?
  //   const peerIds = (mspInfo.multiaddresses || [])
  //   .map((addr: string) => addr.split("/p2p/").pop())
  //   .filter(Boolean);
  const replicationLevel = ReplicationLevel.Basic;
  const replicas = 0;

  const txHashStorageReq = await storageHubClient.issueStorageRequest(
    bucketId as `0x${string}`,
    fileLocation,
    fingerprint.toHex() as `0x${string}`,
    fileSizeBigInt,
    mspId,
    peerIds,
    replicationLevel,
    replicas
  );
  console.log('Storage request created in tx:', txHashStorageReq);

  const receiptStorageReq = await publicClient.waitForTransactionReceipt({ hash: txHashStorageReq });
  if (receiptStorageReq.status !== 'success') {
    throw new Error(`Storage request transaction failed: ${txHashStorageReq}`);
  }
  console.log('Storage request created receipt:', receiptStorageReq);

  // Compute the file key
  const registry = new TypeRegistry();
  const owner = registry.createType('AccountId20', account.address) as AccountId20;
  const bucketIdH256 = registry.createType('H256', bucketId) as H256;
  const fileKey: H256 = await fileManager.computeFileKey(owner, bucketIdH256, fileLocation);

  // Check that the storage request exists on chain
  const storageRequest = await userApi.query.fileSystem.storageRequests(fileKey);
  if (!storageRequest.isSome) {
    throw new Error('Storage request not found on chain');
  }
  const storageRequestData = storageRequest.unwrap();
  console.log('Storage request data:', storageRequestData);
  console.log('Storage request bucketId:', storageRequestData.bucketId.toString());
  console.log(
    'Storage request fingerprint should be the same sa initial fingerprint',
    storageRequestData.fingerprint.toString() === fingerprint.toString()
  );

  //   Upload the file

  const uploadReceipt: UploadReceipt = await mspClient.uploadFile(
    bucketId,
    fileKey.toHex(),
    await fileManager.getFileBlob(),
    address,
    fileLocation
  );
  console.log('uploaded:', uploadReceipt);
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

  const downloadResponse = await mspClient.downloadByKey(fileKey.toHex());
  console.log('downloadResponse status', downloadResponse.status);
  console.log('downloadResponse', downloadResponse);

  const downloadFileBlob = await new Response(downloadResponse.stream).blob();

  console.log();
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

  await userApi.disconnect();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
