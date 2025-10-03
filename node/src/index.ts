import { ethers } from 'ethers';
import 'dotenv/config';
import { HttpClientConfig, initWasm } from '@storagehub-sdk/core';
import { MspClient, type InfoResponse, type StatsResponse, type ValueProp } from '@storagehub-sdk/msp-client';

import { chainInfo } from '../data/chainInfo';

const main = async () => {
  await initWasm();

  const provider = new ethers.JsonRpcProvider(chainInfo.rpcUrl, {
    chainId: chainInfo.chainId,
    name: chainInfo.name,
  });

  let wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  console.log('baseUrl =', chainInfo.baseUrl, typeof chainInfo.baseUrl);
  const httpCfg: HttpClientConfig = { baseUrl: chainInfo.baseUrl };
  const client = await MspClient.connect(httpCfg);

  const health = await client.getHealth();
  console.log('MSP service health:', health);

  // MSP info endpoints
  const info: InfoResponse = await client.getInfo();
  console.log('MSP Info:', info);
  const stats: StatsResponse = await client.getStats();
  console.log('MSP Stats:', stats);
  const valueProps: ValueProp[] = await client.getValuePropositions();
  console.log('MSP ValueProps count:', Array.isArray(valueProps) ? valueProps.length : 0);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
