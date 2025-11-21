import { storageHubClient, address, publicClient, polkadotApi } from '../services/clientService.js';
import { getMspHealth, getMspInfo, getValueProps } from '../services/mspService.js';

export async function createBucket(bucketName: string) {
  // Get MSP info and value proposition
  const { mspId } = await getMspInfo();
  //   const mspInfo = await getMspInfo();
  //   console.log('MSP Info:', mspInfo);
  const valuePropId = await getValueProps();
  console.log(`Value Prop ID: ${valuePropId}`);

  // Derive bucket ID
  const bucketId = (await storageHubClient.deriveBucketId(address, bucketName)) as string;
  console.log(`Derived bucket ID: ${bucketId}`);

  // Check that the bucket doesn't exist yet
  const bucketBeforeCreation = await polkadotApi.query.providers.buckets(bucketId);
  console.log('Bucket before creation is empty', bucketBeforeCreation.isEmpty);
  if (!bucketBeforeCreation.isEmpty) {
    throw new Error(`Bucket already exists: ${bucketId}`);
  }

  const isPrivate = false;

  // Create bucket on chain
  const txHash: `0x${string}` | undefined = await storageHubClient.createBucket(
    mspId as `0x${string}`,
    bucketName,
    isPrivate,
    valuePropId
  );

  console.log('createBucket() txHash:', txHash);
  if (!txHash) {
    throw new Error('createBucket() did not return a transaction hash');
  }

  // Wait for transaction
  const txReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (txReceipt.status !== 'success') {
    throw new Error(`Bucket creation failed: ${txHash}`);
  }

  return { bucketId, txReceipt };
}

export async function verifyBucketCreation(bucketId: string) {
  const { mspId } = await getMspInfo();

  const bucket = await polkadotApi.query.providers.buckets(bucketId);
  if (bucket.isEmpty) {
    throw new Error('Bucket not found on chain after creation');
  }

  const bucketData = bucket.unwrap();
  console.log('Bucket userId matches initial bucket owner address', bucketData.userId.toString() === address);
  console.log(`Bucket MSPId matches initial MSPId: ${bucketData.mspId.toString() === mspId}`);
  return bucketData;
}

export async function deleteBucket(bucketId: string) {
  const txHash: `0x${string}` | undefined = await storageHubClient.deleteBucket(bucketId as `0x${string}`);
  console.log('deleteBucket() txHash:', txHash);
  if (!txHash) {
    throw new Error('deleteBucket() did not return a transaction hash');
  }

  // Wait for transaction
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log('Bucket deletion receipt:', receipt);
  if (receipt.status !== 'success') {
    throw new Error(`Bucket deletion failed: ${txHash}`);
  }
}
