import { Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { config } from '../../src/config/environment.js';

// Make sure WASM crypto is initialized *before* we create any keypairs
await cryptoWaitReady();

// Create signer from secret URI
const walletKeyring = new Keyring({ type: 'ethereum' });
const signer = walletKeyring.addFromUri(config.privateKey);

// const ss58 = polkadotApi.registry.chainSS58 || 42;
// console.log('BSP SS58 Format:', ss58);
const bspKeyring = new Keyring({ type: 'ecdsa' });
const bspSigner = bspKeyring.addFromUri(config.bspSeedPhrase);

export { signer, bspSigner };
