import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { uploadFile } from './operations/fileOperations.js';

async function run() {
  // Initialize WASM
  await initWasm();

  const bucketId = '0x14739407f7ba708865898284101b8f60d490b74f79c79612569d9a956a6186a2';

  // Upload file
  const fileName = 'helloworld.txt';
  const filePath = new URL(`../files/${fileName}`, import.meta.url).pathname;

  const { fileKey, uploadReceipt } = await uploadFile(bucketId, filePath, fileName);
  console.log(`File uploaded: ${fileKey}`);
  console.log(`Status: ${uploadReceipt.status}\n`);

  await polkadotApi.disconnect();
}

run();
