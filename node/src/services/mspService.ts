import { HealthStatus, InfoResponse, MspClient, StatsResponse, VerifyResponse } from '@storagehub-sdk/msp-client';
import { NETWORKS } from '../config/networks.js';
import { HttpClientConfig } from '@storagehub-sdk/core';
import { address, walletClient } from './clientService.js';

const httpCfg: HttpClientConfig = { baseUrl: NETWORKS.stagenet.mspBaseUrl };
const mspClient = await MspClient.connect(httpCfg);

const getMspInfo = async (): Promise<InfoResponse> => {
  const mspInfo = await mspClient.getInfo();
  console.log(`MSP ID: ${mspInfo.mspId}`);
  return mspInfo;
};

const getMspHealth = async (): Promise<HealthStatus> => {
  const mspHealth = await mspClient.getHealth();
  console.log(`MSP Health: ${mspHealth}`);
  return mspHealth;
};

const getValueProposition = async (): Promise<`0x${string}`> => {
  const valueProps = await mspClient.getValuePropositions();
  if (!Array.isArray(valueProps) || valueProps.length === 0) {
    throw new Error('No value propositions available from MSP');
  }
  const valuePropId = valueProps[0].id as `0x${string}`;
  console.log(`   Value Prop ID: ${valuePropId}`);
  return valuePropId;
};

const getMspStats = async (): Promise<StatsResponse> => {
  const stats = await mspClient.getStats();
  console.log('MSP Stats:', stats);
  return stats;
};

// Authenticate user
const authenticateUser = async (): Promise<VerifyResponse> => {
  const { message } = await mspClient.getNonce(address, NETWORKS.stagenet.id);
  // console.log('message', message);
  const signature = await walletClient.signMessage({
    message,
    account: address,
  });
  // console.log('signature', signature);
  const verified: VerifyResponse = await mspClient.verify(message, signature);
  // console.log('verified', verified);
  mspClient.setToken(verified.token);
  // console.log('Verified user', verified.user);
  return verified;
};

export { mspClient, getMspStats, getMspInfo, getMspHealth, getValueProposition, authenticateUser };
