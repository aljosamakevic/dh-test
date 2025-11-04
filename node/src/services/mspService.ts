import {
  AuthState,
  AuthStatus,
  HealthStatus,
  InfoResponse,
  MspClient,
  StatsResponse,
  UserInfo,
  ValueProp,
} from '@storagehub-sdk/msp-client';
import { NETWORKS } from '../config/networks.js';
import { HttpClientConfig } from '@storagehub-sdk/core';
import { address, walletClient } from './clientService.js';

const httpCfg: HttpClientConfig = { baseUrl: NETWORKS.stagenet.mspUrl };
const mspClient = await MspClient.connect(httpCfg);

const getMspInfo = async (): Promise<InfoResponse> => {
  const mspInfo = await mspClient.info.getInfo();
  // console.log(`MSP ID: ${mspInfo.mspId}`);
  return mspInfo;
};

const getMspHealth = async (): Promise<HealthStatus> => {
  const mspHealth = await mspClient.info.getHealth();
  // console.log(`MSP Health: ${mspHealth}`);
  return mspHealth;
};

const getValueProposition = async (): Promise<`0x${string}`> => {
  const valueProps: ValueProp[] = await mspClient.info.getValuePropositions();
  if (!Array.isArray(valueProps) || valueProps.length === 0) {
    throw new Error('No value propositions available from MSP');
  }
  const valuePropId = valueProps[0].id as `0x${string}`;
  // console.log(`Value Prop ID: ${valuePropId}`);
  return valuePropId;
};

const getMspStats = async (): Promise<StatsResponse> => {
  const stats = await mspClient.info.getStats();
  console.log('MSP Stats:', stats);
  return stats;
};

// Authenticate user
const authenticateUser = async (): Promise<UserInfo> => {
  const auth: AuthStatus = await mspClient.auth.getAuthStatus();
  console.log('MSP Auth Status:', auth.status);
  if (auth.status !== 'Authenticated') {
    await mspClient.auth.SIWE(walletClient);
    console.log('User authenticated with MSP via SIWE');
  }
  const profile: UserInfo = await mspClient.auth.getProfile();

  return profile;
};

export { mspClient, getMspStats, getMspInfo, getMspHealth, getValueProposition, authenticateUser };
