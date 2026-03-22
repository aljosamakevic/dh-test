import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { authenticateUser } from './services/mspService.js';
import { getBucketFilesFromMSP, requestDeleteFile } from './operations/fileOperations.js';
import { getBucketsFromMSP } from './operations/bucketOperations.js';
import { Bucket, type FileTree } from '@storagehub-sdk/msp-client';

function collectFileKeys(entries: FileTree[]): `0x${string}`[] {
  const keys: `0x${string}`[] = [];
  for (const entry of entries) {
    if (entry.type === 'file') {
      keys.push(entry.fileKey);
    } else {
      keys.push(...collectFileKeys(entry.children));
    }
  }
  return keys;
}

/** Set to a bucket id to target that bucket; leave null to use the first bucket from the MSP list. */
const BUCKET_ID_OVERRIDE: `0x${string}` | null = null;

async function run() {
  await initWasm();

  console.log('Deleting the first two files in a bucket...');

  const authProfile = await authenticateUser();
  console.log('Authenticated user profile:', authProfile);

  let bucketId: `0x${string}`;

  if (BUCKET_ID_OVERRIDE) {
    bucketId = BUCKET_ID_OVERRIDE;
    console.log(`Using bucket ID from BUCKET_ID_OVERRIDE: ${bucketId}`);
  } else {
    const buckets = await getBucketsFromMSP();
    if (buckets.length === 0) {
      throw new Error('No buckets found. Set BUCKET_ID_OVERRIDE or create a bucket first.');
    }
    const bucket: Bucket = buckets[0];
    bucketId = bucket.bucketId;
    console.log(`Selected first bucket: "${bucket.name}" (ID: ${bucketId}, Files: ${bucket.fileCount})`);
  }

  const fileList = await getBucketFilesFromMSP(bucketId);
  const fileKeys = collectFileKeys(fileList.files);

  if (fileKeys.length === 0) {
    console.log(`No files in bucket ${bucketId}. Nothing to delete.`);
    await polkadotApi.disconnect();
    return;
  }

  const toDelete = fileKeys.slice(0, 2);
  console.log(`Deleting ${toDelete.length} file(s) (first ${toDelete.length} in tree order):`, toDelete);

  for (const fileKey of toDelete) {
    await requestDeleteFile(bucketId, fileKey);
  }

  console.log('Done.');
  await polkadotApi.disconnect();
}

run();
