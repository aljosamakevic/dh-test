import { createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/node';
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat';
import { datahaven } from '@polkadot-api/descriptors';
import { Binary } from 'polkadot-api';

// Connect to DataHaven node with error handling
const wsProvider = getWsProvider('ws://localhost:9944');
const client = createClient(withPolkadotSdkCompat(wsProvider));
const typedApi = client.getTypedApi(datahaven);

// BSP signer (using your BCSV key account)
const bspSigner = /* your polkadot-api signer */;

// BSP configuration
const capacity = BigInt(858_993_459_200); // 800 GiB (80% of 1 TB disk)
const multiaddresses = [
  '/ip4/127.0.0.1/tcp/30333',
  '/dns/bsp01.example.com/tcp/30333'
].map(addr => Binary.fromText(addr));

// Step 1: Request BSP sign up
const requestTx = typedApi.tx.Providers.request_bsp_sign_up({
  capacity: capacity,
  multiaddresses: multiaddresses,
  payment_account: bspSigner.publicKey  // Account receiving payments
});

// Sign and submit the request
const requestResult = await requestTx.signAndSubmit(bspSigner);
console.log('BSP sign-up requested. Waiting for finalization...');

await requestResult.finalized();
console.log('Request finalized! Deposit has been reserved.');