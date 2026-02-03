import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { Keyring } from '@polkadot/api';
import { config } from '../src/config/environment.js';

async function fundBspAddress() {
  // Initialize WASM
  await initWasm();

  const bspAddress = 'KWD8ccdd317Nzf849PnQ2dqBQ2zoTcSqL9LFFnRrsKv16VRRW';

  // Amount in smallest units of the native token.
  const amount = 150_000_000_000_000_000_000n;

  // Create signer from secret URI
  const keyring = new Keyring({ type: 'ethereum' });
  const sender = keyring.addFromUri(config.privateKey);

  console.log('Sender address:', sender.address);
  console.log('Recipient:', bspAddress);
  console.log('Amount (raw):', amount.toString());

  // Build transfer extrinsic
  const tx = polkadotApi.tx.balances.transferKeepAlive(bspAddress, amount);

  const unsub = await tx.signAndSend(sender, (result) => {
    const { status, dispatchError } = result;
    console.log(`Current status: ${status.type}`);

    if (dispatchError) {
      if (dispatchError.isModule) {
        const decoded = polkadotApi.registry.findMetaError(dispatchError.asModule);
        const { name, section } = decoded;
        console.log(`Error: ${section}.${name}`);
      }
    }

    if (status.isFinalized) {
      console.log('Transaction finalized');
      unsub();
    }
  });

  await polkadotApi.disconnect();
}

async function checkBspBalance() {
  // Initialize WASM
  await initWasm();

  const bspAddress = 'KWD8ccdd317Nzf849PnQ2dqBQ2zoTcSqL9LFFnRrsKv16VRRW';

  // Query balance
  const { data: balance } = await polkadotApi.query.system.account(bspAddress);
  console.log(`BSP Address Balance: ${balance.free.toBigInt()} (raw units)`);

  await polkadotApi.disconnect();
}

checkBspBalance();

// fundBspAddress();
