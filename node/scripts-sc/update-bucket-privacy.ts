import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { verifyBucketCreation, updateBucketPrivacy } from './operations/bucketOperations.js';

async function run() {
  await initWasm();

  console.log('🚀 Starting Update Bucket Privacy Script...\n');

  const bucketId = 'INSERT_BUCKET_ID';

  // 1. Update bucket privacy to private
  console.log('--- Updating bucket to PRIVATE ---');
  await updateBucketPrivacy(bucketId, true);

  // 2. Verify the privacy was updated on chain
  console.log('\n--- Verifying bucket is now private ---');
  const bucketDataAfterPrivate = await verifyBucketCreation(bucketId);
  console.log('Bucket data after setting private:', bucketDataAfterPrivate);
  console.log(`Privacy after update: ${bucketDataAfterPrivate.private}\n`);

  console.log('\n🚀 Update Bucket Privacy Script Completed Successfully.');

  await polkadotApi.disconnect();
}

run();
