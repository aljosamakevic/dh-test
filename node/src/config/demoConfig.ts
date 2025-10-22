import { ReplicationLevel } from '@storagehub-sdk/core';

export const DEMO_CONFIG = {
  bucketName: 'bucket-003',
  fileName: 'papermoon_logo.jpeg',
  filePath: new URL('../files/papermoon_logo.jpeg', import.meta.url).pathname,
  downloadPath: new URL('../files/papermoon_logo_downloaded.jpeg', import.meta.url).pathname,
  replicationLevel: ReplicationLevel.Basic,
  replicas: 0,
} as const;
