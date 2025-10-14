import { Chain, defineChain } from 'viem';
import { NETWORKS } from './networks.js';

export const chain: Chain = defineChain({
  id: NETWORKS.stagenet.id,
  name: NETWORKS.stagenet.name,
  nativeCurrency: { name: 'Have', symbol: 'HAVE', decimals: 18 },
  rpcUrls: { default: { http: [NETWORKS.stagenet.rpcUrl] } },
});
