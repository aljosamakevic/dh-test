import { privateKeyToAccount } from 'viem/accounts';
import { NETWORKS, chain } from '../config/networks.js';
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
  transport: http(NETWORKS.testnet.rpcUrl),
});

const publicClient: PublicClient = createPublicClient({
  chain,
  transport: http(NETWORKS.testnet.rpcUrl),
});

// Create StorageHub client
const storageHubClient: StorageHubClient = new StorageHubClient({
  rpcUrl: NETWORKS.testnet.rpcUrl,
  chain: chain,
  walletClient: walletClient,
  filesystemContractAddress: NETWORKS.testnet.filesystemContractAddress,
});

// Create Polkadot API client
const provider = new WsProvider(NETWORKS.testnet.wsUrl);
const polkadotApi: ApiPromise = await ApiPromise.create({
  provider,
  typesBundle: types,
  noInitWarn: true,
});

export { chain, account, address, publicClient, walletClient, storageHubClient, polkadotApi, signer };
