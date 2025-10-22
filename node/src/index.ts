import 'dotenv/config';
import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { substrateApi } from './services/clientService.js';
import { DEMO_CONFIG } from './config/demoConfig.js';
import { createBucket, verifyBucketCreation } from './operations/bucketOperations.js';
import { uploadFile, downloadFile, verifyDownload } from './operations/fileOperations.js';

const main = async () => {
  console.log('🚀 Starting DataHaven Storage Demo...\n');

  try {
    // Initialize WASM
    await initWasm();

    // 1. Create Bucket
    console.log('- Creating bucket...');
    const { bucketId, txHash } = await createBucket(DEMO_CONFIG.bucketName);
    console.log(`- Bucket created: ${bucketId}`);
    console.log(`- Transaction: ${txHash}\n`);

    // 2. Verify bucket exists on chain
    await verifyBucketCreation(bucketId);
    console.log('- Bucket verified on chain\n');

    // 3. Upload file
    console.log('- Uploading file...');
    const { fileKey, uploadReceipt } = await uploadFile(bucketId, DEMO_CONFIG.filePath, DEMO_CONFIG.fileName);
    console.log(`- File uploaded: ${fileKey}`);
    console.log(`- Status: ${uploadReceipt.status}\n`);

    // throw new Error('TEMP custom stop');

    // 4. Download file
    console.log('- Downloading file...');
    const downloadPath = await downloadFile(fileKey, DEMO_CONFIG.downloadPath);
    console.log(`- File downloaded to: ${downloadPath}\n`);

    // 5. Verify download
    const isValid = await verifyDownload(DEMO_CONFIG.filePath, downloadPath);
    console.log(`- File integrity verified: ${isValid ? 'PASSED' : 'FAILED'}\n`);

    console.log('- Demo completed successfully!');
  } catch (error) {
    console.error('- Demo failed:', error);
    throw error;
  } finally {
    await substrateApi.disconnect();
    console.log('- Disconnected from substrate API');
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
