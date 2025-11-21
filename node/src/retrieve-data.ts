// --8<-- [start:imports]
import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { downloadFile, verifyDownload } from './operations/fileOperations.js';

// --8<-- [end:imports]

async function run() {
  // For anything from @storagehub-sdk/core to work, initWasm() is required
  // on top of the file
  await initWasm();

  // --8<-- [start:init-setup]
  const fileKeyHex = '0x7d5603e254e7a88e6f5c1784555b4c13287e013af8d7ba9a2fcabfdcde62b6a6';
  const fileKey = polkadotApi.createType('H256', fileKeyHex);
  const filePath = new URL(`./files/helloworld.txt`, import.meta.url).pathname;
  const downloadedFilePath = new URL('./files/helloworld_downloaded.txt', import.meta.url).pathname;
  // make sure the file extension matches the original file
  // --8<-- [end:init-setup]

  // --8<-- [start:download-data]
  // Download file
  const downloadedFile = await downloadFile(fileKey, downloadedFilePath);
  console.log(`File type: ${downloadedFile.mime}`);
  console.log(`Downloaded ${downloadedFile.size} bytes to ${downloadedFile.path}`);
  // --8<-- [end:download-data]

  // Verify download
  const isValid = await verifyDownload(filePath, downloadedFilePath);
  console.log(`File integrity verified: ${isValid ? 'PASSED' : 'FAILED'}`);

  await polkadotApi.disconnect();
}

run();
