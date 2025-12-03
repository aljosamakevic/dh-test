import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { createBucket, verifyBucketCreation } from './operations/bucketOperations.js';
import { HealthStatus } from '@storagehub-sdk/msp-client';
import { mspClient } from './services/mspService.js';

async function run() {
  // Initialize WASM
  await initWasm();

  const mspHealth: HealthStatus = await mspClient.info.getHealth();
  console.log('MSP Health Status:', mspHealth);

  // 1. Create Bucket
  const bucketName = 'init-bucket-a';
  const { bucketId, txReceipt } = await createBucket(bucketName);
  console.log(`Created Bucket ID: ${bucketId}`);
  console.log(`createBucket() txReceipt: ${txReceipt}`);

  // 2. Verify bucket exists on chain
  const bucketData = await verifyBucketCreation(bucketId);
  console.log('Bucket data:', bucketData);

  await polkadotApi.disconnect();
}

run();
