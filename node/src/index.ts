import 'dotenv/config';
import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { DEMO_CONFIG } from './config/demoConfig.js';
import { createBucket, deleteBucket, verifyBucketCreation } from './operations/bucketOperations.js';
import { uploadFile, downloadFile, verifyDownload, deleteFile } from './operations/fileOperations.js';
import { getBucketList } from './services/mspService.js';

const main = async () => {
  console.log('🚀 Starting DataHaven Storage Demo...\n');

  try {
    // Initialize WASM
    await initWasm();

    // 1. Create Bucket
    console.log('Creating bucket...');
    const { bucketId, txReceipt } = await createBucket(DEMO_CONFIG.bucketName);
    console.log(`Created Bucket ID: ${bucketId}`);
    console.log(`createBucket() txReceipt: ${txReceipt}\n`);

    // 2. Verify bucket exists on chain
    await verifyBucketCreation(bucketId);
    console.log('Bucket verified on chain\n');

    // 3. Upload file
    console.log('Uploading file...');
    const { fileKey, uploadReceipt } = await uploadFile(bucketId, DEMO_CONFIG.filePath, DEMO_CONFIG.fileName);
    console.log(`File uploaded: ${fileKey}`);
    console.log(`Status: ${uploadReceipt.status}\n`);

    // throw new Error('TEMP custom stop');

    // 4. Download file
    console.log('Downloading file...');
    const downloadPath = await downloadFile(fileKey, DEMO_CONFIG.downloadPath);
    console.log(`File downloaded to: ${downloadPath}\n`);

    // 5. Verify download
    const isValid = await verifyDownload(DEMO_CONFIG.filePath, DEMO_CONFIG.downloadPath);
    console.log(`File integrity verified: ${isValid ? 'PASSED' : 'FAILED'}\n`);

    // Bonus: List existing buckets
    // const bucketList = await getBucketList();

    // 6. Delete file and bucket (optional)
    // console.log('- Deleting file...');
    // await deleteFile(bucketId, fileKey);
    // console.log('- File deleted from network\n');

    // console.log('- Deleting bucket...');
    // await deleteBucket(bucketId);
    // console.log('- Bucket deleted from network\n');

    console.log('🚀  Demo completed successfully!');
  } catch (error) {
    console.error('- Demo failed:', error);
    throw error;
  } finally {
    await polkadotApi.disconnect();
    console.log('- Disconnected from substrate API');
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
