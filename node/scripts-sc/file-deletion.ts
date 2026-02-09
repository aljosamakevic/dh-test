import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { requestDeleteFile, getPendingFileDeletionRequestsCount } from './operations/fileOperations.js';
import { waitForBackendBucketEmpty, deleteBucket } from './operations/bucketOperations.js';

async function run() {
  await initWasm();

  console.log('🚀 Starting File Deletion Script...\n');

  const bucketId = '0xdfe5918747e234609fa3cdc804b30c647988e3e4a76cb830bcfa281a65b9db60';
  const fileKey = '0xa8e1ba9bee31f1406991205c75974bd524d2b57b86eb1d324dab187fde29f27f';

  // 1. Check pending file deletion requests count BEFORE deletion
  console.log('\n--- Checking pending file deletion requests BEFORE deletion ---');
  const countBefore = await getPendingFileDeletionRequestsCount();
  console.log(`Pending deletion requests before: ${countBefore}\n`);

  // 2. Request file deletion
  console.log('--- Requesting file deletion ---');
  await requestDeleteFile(bucketId, fileKey);

  // 3. Check pending file deletion requests count AFTER deletion
  console.log('\n--- Checking pending file deletion requests AFTER deletion ---');
  const countAfter = await getPendingFileDeletionRequestsCount();
  console.log(`Pending deletion requests after: ${countAfter}\n`);

  // 4. Wait for the bucket to become empty in the MSP backend
  console.log('--- Waiting for bucket to become empty ---');
  await waitForBackendBucketEmpty(bucketId);

  // 5. Delete the now-empty bucket
  console.log('\n--- Deleting the empty bucket ---');
  await deleteBucket(bucketId);
  console.log(`Bucket ${bucketId} deleted successfully`);

  console.log('\n🚀 File Deletion Script Completed Successfully.');

  await polkadotApi.disconnect();
}

run();
