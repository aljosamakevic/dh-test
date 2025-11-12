import {
  Bucket,
  HealthStatus,
  InfoResponse,
  MspClient,
  StatsResponse,
  UserInfo,
  ValueProp,
} from '@storagehub-sdk/msp-client';
import { chosenNetwork } from '../config/networks.js';
import { HttpClientConfig } from '@storagehub-sdk/core';
import { address, walletClient } from './clientService.js';

const httpCfg: HttpClientConfig = { baseUrl: chosenNetwork.mspUrl };
const sessionProvider = async () =>
  sessionToken ? ({ token: sessionToken, user: { address: address } } as const) : undefined;
const mspClient = await MspClient.connect(httpCfg, sessionProvider);
let sessionToken: string | undefined = undefined;

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

const getValueProps = async (): Promise<`0x${string}`> => {
  const valueProps: ValueProp[] = await mspClient.info.getValuePropositions();
  if (!Array.isArray(valueProps) || valueProps.length === 0) {
    throw new Error('No value propositions available from MSP');
  }
  // For simplicity, select the first value proposition and return its ID
  const valuePropId = valueProps[0].id as `0x${string}`;
  console.log(`Chose Value Prop ID: ${valuePropId}`);
  return valuePropId;
};

const getMspStats = async (): Promise<StatsResponse> => {
  const stats = await mspClient.info.getStats();
  console.log('MSP Stats:', stats);
  return stats;
};

// Authenticate user
const authenticateUser = async (): Promise<UserInfo> => {
  console.log('Authenticating user with MSP via SIWE...');
  const siweSession = await mspClient.auth.SIWE(walletClient);
  console.log('SIWE Session:', siweSession);
  sessionToken = (siweSession as { token: string }).token;

  const profile: UserInfo = await mspClient.auth.getProfile();

  return profile;
};

const getBucketList = async (): Promise<Bucket[]> => {
  const bucketList: Bucket[] = await mspClient.buckets.listBuckets();
  console.log(`MSP Buckets List: ${JSON.stringify(bucketList, null, 2)}`);
  return bucketList;
};

export {
  mspClient,
  getMspStats,
  getMspInfo,
  getMspHealth,
  getValueProps,
  authenticateUser,
  sessionProvider,
  getBucketList,
};
