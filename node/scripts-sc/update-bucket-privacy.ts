import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { verifyBucketCreation, updateBucketPrivacy } from './operations/bucketOperations.js';

async function run() {
  await initWasm();

  console.log('🚀 Starting Update Bucket Privacy Script...\n');

  const bucketId = '0xf7c6f9e65cac2166f32e0c0b141166a967d056957f64d973df0b1f744141d02a';

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
