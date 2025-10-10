import { ClientService } from '../services/clientService.js';
import { MspService } from '../services/mspService.js';

export class BucketOperations {
  constructor(private clientService: ClientService, private mspService: MspService) {}

  async createBucket(bucketName: string): Promise<string> {
    const { storageHubClient, publicClient, userApi, address } = this.clientService;
    const mspInfo = await this.mspService.getMspInfo();
    const mspId = mspInfo.mspId as `0x${string}`;
    const valuePropId = await this.mspService.getFirstValuePropId();

    // Derive bucket ID
    const bucketId = (await storageHubClient.deriveBucketId(address as `0x${string}`, bucketName)) as string;
    console.log('Derived bucket ID:', bucketId);

    // Check if bucket exists before creation
    const bucketBeforeCreation = await userApi.query.providers.buckets(bucketId);
    console.log('Bucket before creation is empty:', bucketBeforeCreation.isEmpty);

    // Create bucket
    const txHashBucket = await storageHubClient.createBucket(mspId, bucketName, false, valuePropId);
    console.log('Bucket created in tx:', txHashBucket);

    // Wait for transaction receipt
    const receiptBucket = await publicClient.waitForTransactionReceipt({ hash: txHashBucket });
    if (receiptBucket.status !== 'success') {
      throw new Error(`Create bucket transaction failed: ${txHashBucket}`);
    }
    console.log('Bucket created successfully');

    // Verify bucket creation
    const bucketAfterCreation = await userApi.query.providers.buckets(bucketId);
    console.log('Bucket after creation exists:', !bucketAfterCreation.isEmpty);

    if (!bucketAfterCreation.isEmpty) {
      const bucketData = bucketAfterCreation.unwrap();
      console.log('Bucket MSP ID matches:', bucketData.mspId.toString() === mspId);
    }

    return bucketId;
  }
}
