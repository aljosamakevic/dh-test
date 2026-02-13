import { privateKeyToAccount } from 'viem/accounts';
import { NETWORK, chain } from '../config/networks.js';
import { createPublicClient, createWalletClient, http, WalletClient, PublicClient } from 'viem';
import { StorageHubClient } from '@storagehub-sdk/core';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { types } from '@storagehub/types-bundle';
import { Keyring } from '@polkadot/api';
import { config } from '../../src/config/environment.js';
import 'dotenv/config'; // ***

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const address = account.address;

// Create signer from secret URI
const walletKeyring = new Keyring({ type: 'ethereum' });
const signer = walletKeyring.addFromUri(config.privateKey);

const walletClient: WalletClient = createWalletClient({
  chain,
  account,
  transport: http(NETWORK.rpcUrl),
});

const publicClient: PublicClient = createPublicClient({
  chain,
  transport: http(NETWORK.rpcUrl),
});

// Create StorageHub client
const storageHubClient: StorageHubClient = new StorageHubClient({
  rpcUrl: NETWORK.rpcUrl,
  chain: chain,
  walletClient: walletClient,
  filesystemContractAddress: NETWORK.filesystemContractAddress,
});

// Create Polkadot API client
const provider = new WsProvider(NETWORK.wsUrl);
const polkadotApi: ApiPromise = await ApiPromise.create({
  provider,
  typesBundle: types,
  noInitWarn: true,
});

export { chain, account, address, publicClient, walletClient, storageHubClient, polkadotApi, signer };
