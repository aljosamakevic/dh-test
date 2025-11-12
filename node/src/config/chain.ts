import { Chain, defineChain } from 'viem';
import { chosenNetwork } from './networks.js';

export const chain: Chain = defineChain({
  id: chosenNetwork.id,
  name: chosenNetwork.name,
  nativeCurrency: chosenNetwork.nativeCurrency,
  rpcUrls: { default: { http: [chosenNetwork.rpcUrl] } },
});
