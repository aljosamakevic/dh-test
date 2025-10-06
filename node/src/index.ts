import { ethers } from 'ethers';
import 'dotenv/config';
import { HttpClientConfig, initWasm, LocalWallet } from '@storagehub-sdk/core';
import {
  MspClient,
  VerifyResponse,
  type InfoResponse,
  type StatsResponse,
  type ValueProp,
} from '@storagehub-sdk/msp-client';

import { chainInfo } from '../data/chainInfo';

const main = async () => {
  await initWasm();

  console.log('baseUrl =', chainInfo.baseUrl, typeof chainInfo.baseUrl);
  const httpCfg: HttpClientConfig = { baseUrl: chainInfo.baseUrl };
  const client = await MspClient.connect(httpCfg);

  //   const health = await client.getHealth();
  //   console.log('MSP service health:', health);

  // MSP info endpoints
  //   const info: InfoResponse = await client.getInfo();
  //   console.log('MSP Info:', info);
  //   const stats: StatsResponse = await client.getStats();
  //   console.log('MSP Stats:', stats);
  //   const valueProps: ValueProp[] = await client.getValuePropositions();
  //   console.log('MSP ValueProps count:', Array.isArray(valueProps) ? valueProps.length : 0);
  //   console.log('MSP ValueProps:', valueProps.length > 0 ? valueProps : 'no value props found');

  //   const provider = new ethers.JsonRpcProvider(chainInfo.rpcUrl, {
  //     chainId: chainInfo.chainId,
  //     name: chainInfo.name,
  //   });

  //   let wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const wallet = LocalWallet.fromPrivateKey(process.env.PRIVATE_KEY!);
  const address = await wallet.getAddress();
  console.log('Using address:', address);

  const nonce = await client.getNonce(address, chainInfo.chainId);
  console.log('Full message', nonce);
  const { message } = await client.getNonce(address, chainInfo.chainId);
  console.log('message', message);

  const signature = await wallet.signMessage(message);
  console.log('signature', signature);

  const verified: VerifyResponse = await client.verify(message, signature);
  console.log('verified', verified);

  client.setToken(verified.token);
  console.log('Verified user', verified.user);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
