import { type ChainData } from '../types/index.js';

export const NETWORKS: Record<string, ChainData> = {
  stagenet: {
    id: 55932,
    name: 'DataHaven Stagenet',
    rpcUrl: 'https://services.datahaven-dev.network/stagenet',
    wsUrl: 'wss://services.datahaven-dev.network/stagenet',
    mspUrl: 'https://deo-dh-backend.stagenet.datahaven-infra.network/',
    nativeCurrency: { name: 'Stage', symbol: 'STAGE', decimals: 18 },
  },
  testnet: {
    id: 55931,
    name: 'DataHaven Testnet',
    rpcUrl: 'https://services.datahaven-testnet.network/testnet',
    wsUrl: 'wss://services.datahaven-testnet.network/testnet',
    mspUrl: 'https://deo-dh-backend.testnet.datahaven-infra.network/',
    nativeCurrency: { name: 'Mock', symbol: 'MOCK', decimals: 18 },
  },
  devnet: {
    id: 181222,
    name: 'DataHaven Local Devnet',
    rpcUrl: 'http://127.0.0.1:9666',
    wsUrl: 'wss://127.0.0.1:9666',
    mspUrl: 'http://127.0.0.1:8080/',
    nativeCurrency: { name: 'StorageHub', symbol: 'SH', decimals: 18 },
  },
};

export const chosenNetwork = NETWORKS.stagenet;
