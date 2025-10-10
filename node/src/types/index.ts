export interface DemoConfig {
  bucketName: string;
  testFileName: string;
  replicationLevel: number;
  replicas: number;
}

export const DEMO_CONFIG: DemoConfig = {
  bucketName: 'b1',
  testFileName: 'papermoon_logo.jpeg',
  replicationLevel: 0, // ReplicationLevel.Basic
  replicas: 0,
};
