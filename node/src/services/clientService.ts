import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, createWalletClient, http, WalletClient, PublicClient } from 'viem';
import { StorageHubClient } from '@storagehub-sdk/core';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { types } from '@storagehub/types-bundle';

import { config } from '../config/environment.js';
import { chain } from '../config/chain.js';
import { chosenNetwork } from '../config/networks.js';

const account = privateKeyToAccount(config.privateKey as `0x${string}`);
const address = account.address;

const walletClient: WalletClient = createWalletClient({
  chain,
  account,
  transport: http(chosenNetwork.rpcUrl),
});

const publicClient: PublicClient = createPublicClient({
  chain,
  transport: http(chosenNetwork.rpcUrl),
});

// Create StorageHub client
const storageHubClient: StorageHubClient = new StorageHubClient({
  rpcUrl: chosenNetwork.rpcUrl,
  chain: chain,
  walletClient: walletClient,
  filesystemContractAddress: config.filesystemContractAddress,
});

// Create Polkadot API client
const provider = new WsProvider(chosenNetwork.wsUrl);
const polkadotApi: ApiPromise = await ApiPromise.create({
  provider,
  typesBundle: types,
  noInitWarn: true,
});

export { account, address, publicClient, walletClient, storageHubClient, polkadotApi };
