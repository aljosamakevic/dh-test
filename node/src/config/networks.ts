import { type ChainData } from '../types/index.js';

export const NETWORKS: Record<string, ChainData> = {
  stagenet: {
    id: 1283,
    name: 'DataHaven Stagenet',
    rpcUrl: 'https://services.datahaven-dev.network/stagenet',
    wsUrl: 'wss://services.datahaven-dev.network/stagenet',
    // mspUrl: 'https://sh-mspbackend.datahaven-kt.xyz/',
    mspUrl: 'https://deo-dh-backend.stagenet.datahaven-infra.network/',
  },
  testnet: {
    id: 1288,
    name: 'DataHaven Testnet',
    rpcUrl: 'https://services.datahaven-testnet.network/testnet',
    wsUrl: 'wss://services.datahaven-testnet.network/testnet',
    mspUrl: 'https://deo-dh-backend.testnet.datahaven-infra.network/',
  },
};
