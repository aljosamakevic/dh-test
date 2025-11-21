import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { authenticateUser } from './services/mspService.js';
import { requestDeleteFile } from './operations/fileOperations.js';
import { deleteBucket } from './operations/bucketOperations.js';

async function run() {
  // Initialize WASM
  await initWasm();

  // --8<-- [start:init-setup]
  const bucketId = '0x14739407f7ba708865898284101b8f60d490b74f79c79612569d9a956a6186a2'; // `0x${string}`
  const fileKey = '0x7d5603e254e7a88e6f5c1784555b4c13287e013af8d7ba9a2fcabfdcde62b6a6'; // `0x${string}`
  // If not in hex already convert it with .toHex()
  // --8<-- [end:init-setup]

  // Authenticate
  const authProfile = await authenticateUser();
  console.log('Authenticated user profile:', authProfile);

  // --8<-- [start:request-file-deletion]
  // Request file deletion
  const isDeletionRequestSuccessful = await requestDeleteFile(bucketId, fileKey);
  console.log('File deletion request submitted succesfully:', isDeletionRequestSuccessful);
  // --8<-- [end:request-file-deletion]

  // --8<-- [start:delete-bucket]
  const IsBucketDeletionSuccessful = await deleteBucket(bucketId);
  console.log('Bucket deletion successful:', IsBucketDeletionSuccessful);
  // --8<-- [end:delete-bucket]

  await polkadotApi.disconnect();
}

run();
