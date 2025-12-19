import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from '../services/clientService.js';
import { Keyring } from '@polkadot/api';
import { config } from '../../src/config/environment.js';
import { Binary } from 'polkadot-api';

async function requestBspSignUp() {
  // Initialize WASM
  await initWasm();

  const keyring = new Keyring({ type: 'sr25519' });
  const bspSigner = keyring.addFromUri(config.bspSeedPhrase);

  const nodeIdentity = '12D3KooWPPvCxeYfyPYC9eGT674VDzUc8QSYujJrQtZsVZSdHgAS';
  const ipAddress = '79.117.162.20';

  // BSP configuration
  const capacity = BigInt(10_737_418_240); // 10 GiB (80% of 12 GiB disk)
  const multiaddresses = [`/ip4/${ipAddress}/tcp/30334/p2p/${nodeIdentity}`].map((addr) => Binary.fromText(addr));

  // Step 1: Request BSP sign up
  const requestTx = polkadotApi.tx.Providers.request_bsp_sign_up({
    capacity: capacity,
    multiaddresses: multiaddresses,
    payment_account: bspSigner.publicKey, // Account receiving payments
  });

  // Sign and submit the request
  await new Promise<void>((resolve, reject) => {
    requestTx
      .signAndSend(bspSigner, ({ status, dispatchError }) => {
        console.log('BSP sign-up requested. Waiting for finalization...');
        if (dispatchError) {
          reject(dispatchError);
        }
        if (status.isFinalized) {
          console.log('Request finalized! Deposit has been reserved.');
          resolve();
        }
      })
      .catch(reject);
  });

  await polkadotApi.disconnect();
}

async function confirmBspSignUp() {
  // Initialize WASM
  await initWasm();

  const keyring = new Keyring({ type: 'sr25519' });
  const bspSigner = keyring.addFromUri(config.bspSeedPhrase);

  // Step 2: Confirm the sign-up (after waiting for randomness)
  const confirmTx = polkadotApi.tx.Providers.confirm_sign_up({
    provider_account: undefined, // Optional: omit to use signer's account
  });

  await new Promise<void>((resolve, reject) => {
    confirmTx
      .signAndSend(bspSigner, ({ status, dispatchError }) => {
        console.log('Confirming BSP registration...');
        if (dispatchError) {
          reject(dispatchError);
        }
        if (status.isFinalized) {
          console.log('BSP registration confirmed and active!');
          resolve();
        }
      })
      .catch(reject);
  });

  await polkadotApi.disconnect();
}

requestBspSignUp();
// confirmBspSignUp();
