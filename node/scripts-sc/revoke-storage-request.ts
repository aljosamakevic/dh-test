import '@storagehub/api-augment';
import { initWasm, FileManager, ReplicationLevel } from '@storagehub-sdk/core';
import { createReadStream, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { TypeRegistry } from '@polkadot/types';
import { AccountId20, H256 } from '@polkadot/types/interfaces';
import {
  account,
  filesystemContractAddress,
  publicClient,
  walletClient,
  polkadotApi,
  chain,
} from './services/clientService.js';
import { getMspInfo } from './services/mspService.js';
import { toHex } from 'viem';
import fileSystemAbi from './abis/FileSystem.json' with { type: 'json' };
import { revokeStorageRequest } from './operations/fileOperations.js';

async function run() {
  await initWasm();

  console.log('🚀 Starting Revoke Storage Request Script...\n');

  const bucketId = 'INSERT_BUCKET_ID';

  // 1. Issue a storage request (without uploading the file to the MSP)
  console.log('\n--- Issuing storage request ---');
  const fileName = 'helloworld.txt';
  const filePath = new URL(`./files/${fileName}`, import.meta.url).pathname;

  const fileSize = statSync(filePath).size;
  const fileManager = new FileManager({
    size: fileSize,
    stream: () => Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>,
  });

  const fingerprint = await fileManager.getFingerprint();
  const fileSizeBigInt = BigInt(fileManager.getFileSize());
  const { mspId, multiaddresses } = await getMspInfo();

  if (!multiaddresses?.length) {
    throw new Error('MSP multiaddresses are missing');
  }
  const peerIds: string[] = (multiaddresses ?? [])
    .map((addr: string) => addr.split('/p2p/').pop())
    .filter((id): id is string => !!id);
  if (peerIds.length === 0) {
    throw new Error('MSP multiaddresses had no /p2p/<peerId> segment');
  }

  const replicationLevel = ReplicationLevel.Custom;
  const replicas = 1;

  // Issue storage request by calling the FileSystem precompile directly
  const txHash = await walletClient.writeContract({
    account,
    address: filesystemContractAddress,
    abi: fileSystemAbi,
    functionName: 'issueStorageRequest',
    args: [
      bucketId as `0x${string}`,
      toHex(fileName),
      fingerprint.toHex() as `0x${string}`,
      fileSizeBigInt,
      mspId as `0x${string}`,
      peerIds.map((id) => toHex(id)),
      replicationLevel,
      replicas,
    ],
    chain: chain,
  });
  console.log('issueStorageRequest() txHash:', txHash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== 'success') {
    throw new Error(`Storage request failed: ${txHash}`);
  }
  console.log('Storage request issued successfully\n');

  // 2. Compute the file key so we can revoke
  const registry = new TypeRegistry();
  const owner = registry.createType('AccountId20', account.address) as AccountId20;
  const bucketIdH256 = registry.createType('H256', bucketId) as H256;
  const fileKey = await fileManager.computeFileKey(owner, bucketIdH256, fileName);
  console.log(`Computed file key: ${fileKey.toHex()}`);

  // 3. Verify the storage request exists on chain before revoking
  const storageRequest = await polkadotApi.query.fileSystem.storageRequests(fileKey);
  if (!storageRequest.isSome) {
    throw new Error('Storage request not found on chain — nothing to revoke');
  }
  console.log('Storage request confirmed on chain — proceeding to revoke\n');

  // 4. Revoke the storage request
  console.log('--- Revoking storage request ---');
  await revokeStorageRequest(fileKey.toHex());

  // 5. Verify the storage request no longer exists on chain
  const storageRequestAfter = await polkadotApi.query.fileSystem.storageRequests(fileKey);
  if (storageRequestAfter.isNone) {
    console.log('Storage request successfully removed from chain after revocation');
  } else {
    console.log('WARNING: Storage request still exists on chain after revocation');
  }

  console.log('\n🚀 Revoke Storage Request Script Completed Successfully.');

  await polkadotApi.disconnect();
}

run();
