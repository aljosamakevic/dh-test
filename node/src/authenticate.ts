import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { authenticateUser } from './services/mspService.js';

async function run() {
  // Initialize WASM
  await initWasm();

  // Authenticate
  const authProfile = await authenticateUser();
  console.log('Authenticated user profile:', authProfile);

  await polkadotApi.disconnect();
}

run();
