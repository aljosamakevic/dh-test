import { storageHubClient, address, publicClient, substrateApi } from '../services/clientService.js';
import { getMspInfo, getValueProposition } from '../services/mspService.js';

export async function createBucket(bucketName: string) {
  // Get MSP info and value proposition
  const { mspId } = await getMspInfo();
  const valuePropId = await getValueProposition();

  // Derive bucket ID
  const bucketId = (await storageHubClient.deriveBucketId(address, bucketName)) as string;
  console.log(`Derived bucket ID: ${bucketId}`);

  // Check that the bucket doesn't exist yet
  const bucketBeforeCreation = await substrateApi.query.providers.buckets(bucketId);
  console.log('Bucket before creation is empty', bucketBeforeCreation.isEmpty);
  if (!bucketBeforeCreation.isEmpty) {
    throw new Error(`Bucket already exists: ${bucketId}`);
  }

  // Create bucket on chain
  const txHash = await storageHubClient.createBucket(mspId as `0x${string}`, bucketName, false, valuePropId);
  console.log('Bucket created in tx:', txHash);

  // Wait for transaction
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== 'success') {
    throw new Error(`Bucket creation failed: ${txHash}`);
  }

  return { bucketId, receipt };
}

export async function verifyBucketCreation(bucketId: string) {
  const { mspId } = await getMspInfo();

  const bucket = await substrateApi.query.providers.buckets(bucketId);
  if (bucket.isEmpty) {
    throw new Error('Bucket not found on chain after creation');
  }

  const bucketData = bucket.unwrap();
  console.log('Bucket data:', bucketData);
  console.log(`Bucket MSPId matches initial MSPId: ${bucketData.mspId.toString() === mspId}`);
  return bucketData;
}
