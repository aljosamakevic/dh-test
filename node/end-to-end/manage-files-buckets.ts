import { initWasm, FileInfo } from '@storagehub-sdk/core';
import { polkadotApi, publicClient, storageHubClient } from './services/clientService';
import { mspClient } from './services/mspService';

async function run() {
  // Initialize WASM
  await initWasm();

  // --8<-- [start:request-file-deletion]

  const bucketId = '0x8009cc4028ab4c8e333b13d38b840107f8467e27be11e9624e3b0d505314a5da';
  const fileKey = '0x83a1bb940db6389e89d14e48178bf622853fcce281e0ceda79b65989fd64e838';

  // Get file info before deletion
  const fileInfo: FileInfo = await mspClient.files.getFileInfo(bucketId, fileKey);
  console.log('File info:', fileInfo);

  // Request file deletion
  const txHashRequestDeleteFile: `0x${string}` = await storageHubClient.requestDeleteFile(fileInfo);
  console.log('requestDeleteFile() txHash:', txHashRequestDeleteFile);

  // Wait for delete file transaction receipt
  const receiptRequestDeleteFile = await publicClient.waitForTransactionReceipt({
    hash: txHashRequestDeleteFile,
  });
  console.log('File deletion receipt:', receiptRequestDeleteFile);
  if (receiptRequestDeleteFile.status !== 'success') {
    throw new Error(`File deletion failed: ${txHashRequestDeleteFile}`);
  }

  console.log(`File with key ${fileKey} deleted successfully from bucket ${bucketId}`);
  // --8<-- [end:request-file-deletion]

  //  --8<-- [start:delete-bucket]

  // Delete bucket
  const txHashDeleteBucket: `0x${string}` | undefined = await storageHubClient.deleteBucket(bucketId as `0x${string}`);
  console.log('deleteBucket() txHash:', txHashDeleteBucket);
  if (!txHashDeleteBucket) {
    throw new Error('deleteBucket() did not return a transaction hash');
  }

  // Wait for transaction
  const receiptDeleteBucket = await publicClient.waitForTransactionReceipt({
    hash: txHashDeleteBucket,
  });
  console.log('Bucket deletion receipt:', receiptDeleteBucket);
  if (receiptDeleteBucket.status !== 'success') {
    throw new Error(`Bucket deletion failed: ${txHashDeleteBucket}`);
  }
  // --8<-- [end:delete-bucket]

  // Disconnect the Polkadot API at the very end
  await polkadotApi.disconnect();
}

await run();
