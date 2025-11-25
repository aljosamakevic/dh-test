import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { H256 } from '@polkadot/types/interfaces';
import { FileInfo } from '@storagehub-sdk/msp-client';
import { mspClient } from './services/mspService.js';

async function run() {
  // Initialize WASM
  await initWasm();

  const bucketId = '0x8009cc4028ab4c8e333b13d38b840107f8467e27be11e9624e3b0d505314a5da';
  const fileKeyHex = '0x83a1bb940db6389e89d14e48178bf622853fcce281e0ceda79b65989fd64e838';
  const fileKey = polkadotApi.createType('H256', fileKeyHex) as H256;

  // Verify storage request on chain
  // const storageRequest = await polkadotApi.query.fileSystem.storageRequests(fileKey);
  // if (!storageRequest.isSome) {
  //   throw new Error('Storage request not found on chain');
  // }

  // Read the storage request data
  // const storageRequestData = storageRequest.unwrap().toHuman();
  // console.log('Storage request data:', storageRequestData);

  const fileInfo: FileInfo = await mspClient.files.getFileInfo(bucketId, fileKeyHex);
  console.log('File info before deletion:', fileInfo);

  await polkadotApi.disconnect();
}

run();
