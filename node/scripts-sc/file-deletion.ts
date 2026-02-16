import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { requestDeleteFile, getPendingFileDeletionRequestsCount } from './operations/fileOperations.js';
import { waitForBackendBucketEmpty, deleteBucket } from './operations/bucketOperations.js';

async function run() {
  await initWasm();

  const bucketId = '0xdfe5918747e234609fa3cdc804b30c647988e3e4a76cb830bcfa281a65b9db60';
  const fileKey = '0xa8e1ba9bee31f1406991205c75974bd524d2b57b86eb1d324dab187fde29f27f';

  // 1. Check pending file deletion requests count BEFORE deletion
  const countBefore = await getPendingFileDeletionRequestsCount();
  console.log(`Pending deletion requests before: ${countBefore}\n`);

  // 2. Request file deletion
  await requestDeleteFile(bucketId, fileKey);

  // 3. Check pending file deletion requests count AFTER deletion
  const countAfter = await getPendingFileDeletionRequestsCount();
  console.log(`Pending deletion requests after: ${countAfter}\n`);

  // 4. Wait for the bucket to become empty in the MSP backend
  await waitForBackendBucketEmpty(bucketId);

  // 5. Delete the now-empty bucket
  await deleteBucket(bucketId);
  console.log(`Bucket ${bucketId} deleted successfully`);

  await polkadotApi.disconnect();
}

run();
