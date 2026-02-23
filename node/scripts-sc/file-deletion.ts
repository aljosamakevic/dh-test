import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { requestDeleteFile, getPendingFileDeletionRequestsCount } from './operations/fileOperations.js';
import { waitForBackendBucketEmpty, deleteBucket } from './operations/bucketOperations.js';

async function run() {
  await initWasm();

  const bucketId = '0x7c457fccb132d1a30809a7b9d34b75256af350eca7a89a689259e253ac9a01b3';
  const fileKey = '0x19fe09f8e541f011f857fae93ce657db04d28b517464ff83ae065b7b4ac0647f';

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
