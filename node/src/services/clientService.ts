import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, createWalletClient, http } from 'viem';
import { StorageHubClient } from '@storagehub-sdk/core';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { types as BundledTypes } from '@storagehub/types-bundle';

import { config } from '../config/environment.js';
import { chain } from '../config/chain.js';
import { chainInfo } from '../../data/chainInfo.js';

export class ClientService {
  public readonly account;
  public readonly address: string;
  public readonly walletClient;
  public readonly publicClient;
  public readonly storageHubClient;
  public readonly userApi;

  private constructor(clients: {
    account: ReturnType<typeof privateKeyToAccount>;
    address: string;
    walletClient: ReturnType<typeof createWalletClient>;
    publicClient: ReturnType<typeof createPublicClient>;
    storageHubClient: StorageHubClient;
    userApi: ApiPromise;
  }) {
    this.account = clients.account;
    this.address = clients.address;
    this.walletClient = clients.walletClient;
    this.publicClient = clients.publicClient;
    this.storageHubClient = clients.storageHubClient;
    this.userApi = clients.userApi;
  }

  static async create(): Promise<ClientService> {
    // Create viem clients
    const account = privateKeyToAccount(config.privateKey as `0x${string}`);
    const address = account.address;

    const walletClient = createWalletClient({
      chain,
      account,
      transport: http(chainInfo.rpcUrl),
    });

    const publicClient = createPublicClient({
      chain,
      transport: http(chainInfo.rpcUrl),
    });

    // Create StorageHub client
    const storageHubClient = new StorageHubClient({
      rpcUrl: chainInfo.rpcUrl,
      chain: chain,
      walletClient: walletClient,
      filesystemContractAddress: config.filesystemContractAddress,
    });

    // Create Polkadot API client
    const provider = new WsProvider(chainInfo.wsUrl);
    const userApi = await ApiPromise.create({
      provider,
      typesBundle: BundledTypes,
      noInitWarn: true,
    });

    return new ClientService({
      account,
      address,
      walletClient,
      publicClient,
      storageHubClient,
      userApi,
    });
  }

  async disconnect(): Promise<void> {
    await this.userApi.disconnect();
  }
}
