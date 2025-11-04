import { Chain, defineChain } from 'viem';
import { NETWORKS } from './networks.js';

export const chain: Chain = defineChain({
  id: NETWORKS.testnet.id,
  name: NETWORKS.testnet.name,
  nativeCurrency: { name: 'Have', symbol: 'HAVE', decimals: 18 },
  rpcUrls: { default: { http: [NETWORKS.testnet.rpcUrl] } },
});
