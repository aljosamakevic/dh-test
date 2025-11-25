import { ReplicationLevel } from '@storagehub-sdk/core';

export const DEMO_CONFIG = {
  bucketName: 'bucket-026',
  // fileName: 'papermoon_logo.jpeg',
  fileName: 'helloworld.txt',
  filePath: new URL(`../files/helloworld.txt`, import.meta.url).pathname,
  // downloadPath: new URL('../files/papermoon_logo_downloaded.jpeg', import.meta.url).pathname,
  downloadPath: new URL('../files/helloworld_downloaded.txt', import.meta.url).pathname,
  replicationLevel: ReplicationLevel.Custom,
  replicas: 1,
} as const;
