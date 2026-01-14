// --8<-- [start:imports]
import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { authenticateUser } from './services/mspService.js';
import { getBucketFilesFromMSP, requestDeleteFile } from './operations/fileOperations.js';
import { deleteBucket, getBucketsFromMSP } from './operations/bucketOperations.js';
// --8<-- [end:imports]

async function run() {
  // Initialize WASM
  await initWasm();

  // --8<-- [start:init-setup]
  const bucketId = '0x354a938554bbae16379f9fcbd04fdee5050a0ec31763426eb341f76a30936a4b'; // `0x${string}`
  const fileKey = '0x03cd70aca1208002fc308dc8feebdeababb4deb46c053632e3d70adcec013d85'; // `0x${string}`
  // If not in hex already, convert it with .toHex()
  // --8<-- [end:init-setup]

  // --8<-- [start:authenticate]
  // Authenticate
  const authProfile = await authenticateUser();
  console.log('Authenticated user profile:', authProfile);
  // --8<-- [end:authenticate]

  // --8<-- [start:get-buckets-msp]
  // Get buckets from MSP
  const buckets = await getBucketsFromMSP();
  console.log('Buckets in MSP:', buckets);
  // --8<-- [end:get-buckets-msp]

  // --8<-- [start:get-bucket-files-msp]
  // Get bucket files from MSP
  const files = await getBucketFilesFromMSP(bucketId);
  console.log(`Files in bucket with ID ${bucketId}:`);
  console.log(JSON.stringify(files, null, 2));
  // --8<-- [end:get-bucket-files-msp]

  // --8<-- [start:request-file-deletion]
  // Request file deletion
  const isDeletionRequestSuccessful = await requestDeleteFile(bucketId, fileKey);
  console.log('File deletion request submitted successfully:', isDeletionRequestSuccessful);
  // --8<-- [end:request-file-deletion]

  // --8<-- [start:delete-bucket]
  // Delete bucket
  const isBucketDeletionSuccessful = await deleteBucket(bucketId);
  console.log('Bucket deletion successful:', isBucketDeletionSuccessful);
  // --8<-- [end:delete-bucket]

  await polkadotApi.disconnect();
}

run();
