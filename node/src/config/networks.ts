import { type ChainData } from '../types/index.js';

export const NETWORKS: Record<string, ChainData> = {
  stagenet: {
    id: 1283,
    name: 'DataHaven Stagenet',
    rpcUrl: 'https://services.datahaven-dev.network/stagenet',
    wsUrl: 'wss://services.datahaven-dev.network/stagenet',
    mspBaseUrl: 'https://sh-mspbackend.datahaven-kt.xyz/',
  },
};
