import type { EvmWriteOptions } from '@storagehub-sdk/core';
import { createPublicClient, Chain, http, PublicClient, defineChain } from 'viem';

const NETWORKS = {
  testnet: {
    id: 55931,
    name: 'DataHaven Testnet',
    rpcUrl: 'https://services.datahaven-testnet.network/testnet',
    wsUrl: 'wss://services.datahaven-testnet.network/testnet',
    mspUrl: 'https://deo-dh-backend.testnet.datahaven-infra.network/',
    nativeCurrency: { name: 'Mock', symbol: 'MOCK', decimals: 18 },
  },
};

const chain: Chain = defineChain({
  id: NETWORKS.testnet.id,
  name: NETWORKS.testnet.name,
  nativeCurrency: NETWORKS.testnet.nativeCurrency,
  rpcUrls: { default: { http: [NETWORKS.testnet.rpcUrl] } },
});

const publicClient: PublicClient = createPublicClient({
  chain,
  transport: http(NETWORKS.testnet.rpcUrl),
});

const buildGasTxOpts = async (): Promise<EvmWriteOptions> => {
  const gas = BigInt('1500000');

  // EIP-1559 fees:
  const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });
  const baseFeePerGas = latestBlock.baseFeePerGas;
  if (baseFeePerGas == null) {
    throw new Error('This RPC did not return `baseFeePerGas` for the latest block. Cannot build EIP-1559 fees.');
  }

  const maxPriorityFeePerGas = BigInt('1500000000'); // 1.5 gwei
  const maxFeePerGas = baseFeePerGas * BigInt(2) + maxPriorityFeePerGas;

  return { gas, maxFeePerGas, maxPriorityFeePerGas };
};

export { buildGasTxOpts };
