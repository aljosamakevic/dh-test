import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { config } from '../../src/config/environment.js';
import { types } from '@storagehub/types-bundle';

// Make sure WASM crypto is initialized *before* we create any keypairs
await cryptoWaitReady();

// Create signer from secret URI
const walletKeyring = new Keyring({ type: 'ethereum' });
const signer = walletKeyring.addFromUri(config.privateKey);

// Make sure to use the BSP's seed phrase here
// generated from following the "Run a BSP Node" steps
const bspEvmKeyring = new Keyring({ type: 'ethereum' });
// const ethDerPath = "m/44'/60'/0'/0/0";
// BSP EVM signer
// const bspEvmSigner = bspEvmKeyring.addFromUri(`${config.bspSeedPhrase}/${ethDerPath}`);
const bspEvmSigner = bspEvmKeyring.addFromUri(config.bspSeedPhrase);
// const bspEvmSignerOther = bspEvmKeyring.addFromUri(`${config.bspSeedPhrase}`);

// console.log('BSP EVM Address other:', bspEvmSignerOther.address);
console.log('BSP EVM Address:', bspEvmSigner.address);

const bspSubstrateKeyring = new Keyring({ type: 'ecdsa' });
// BSP Substrate signer
const bspSubstrateSigner = bspSubstrateKeyring.addFromUri(`${config.bspSeedPhrase}`);
console.log('BSP Substrate Address:', bspSubstrateSigner.address);

// Create Polkadot API client, but for your actively running BSP node
const localBSPwsUrl = `ws://127.0.0.1:9946`;
const provider = new WsProvider(localBSPwsUrl);
const polkadotApiBsp: ApiPromise = await ApiPromise.create({
  provider,
  typesBundle: types,
  noInitWarn: true,
});

export { signer, bspEvmSigner, bspSubstrateSigner, polkadotApiBsp };
