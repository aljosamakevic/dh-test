import { defineChain } from 'viem';
import { chainInfo } from '../../data/chainInfo.js';

export const chain = defineChain({
  id: chainInfo.id,
  name: chainInfo.name,
  nativeCurrency: { name: 'Have', symbol: 'HAVE', decimals: 18 },
  rpcUrls: { default: { http: [chainInfo.rpcUrl] } },
});
