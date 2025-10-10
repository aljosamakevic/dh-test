import { statSync, createReadStream } from 'node:fs';
import { FileManager, ReplicationLevel } from '@storagehub-sdk/core';
import { TypeRegistry } from '@polkadot/types';
import { AccountId20, H256 } from '@polkadot/types/interfaces';
import { Readable } from 'node:stream';

import { ClientService } from '../services/clientService.js';
import { MspService } from '../services/mspService.js';

export class FileOperations {
  constructor(private clientService: ClientService, private mspService: MspService) {}

  createFileManager(filePath: string): FileManager {
    const fileSize = statSync(filePath).size;
    return new FileManager({
      size: fileSize,
      stream: () => Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>,
    });
  }

  async uploadFile(
    bucketId: string,
    filePath: string,
    fileLocation: string
  ): Promise<{ fileKey: string; success: boolean }> {
    const { storageHubClient, publicClient, userApi, account } = this.clientService;
    const mspInfo = await this.mspService.getMspInfo();
    const mspId = mspInfo.mspId as `0x${string}`;

    // Create file manager
    const fileManager = this.createFileManager(filePath);
    console.log('File fingerprint:', await fileManager.getFingerprint());

    // Prepare file upload parameters
    const fingerprint = await fileManager.getFingerprint();
    const fileSizeBigInt = BigInt(fileManager.getFileSize());
    const peerIds = mspInfo.multiaddresses;
    const replicationLevel = ReplicationLevel.Basic;
    const replicas = 0;

    // Issue storage request
    const txHashStorageReq = await storageHubClient.issueStorageRequest(
      bucketId as `0x${string}`,
      fileLocation,
      fingerprint.toHex() as `0x${string}`,
      fileSizeBigInt,
      mspId,
      peerIds,
      replicationLevel,
      replicas
    );
    console.log('Storage request created in tx:', txHashStorageReq);

    // Wait for storage request transaction
    const receiptStorageReq = await publicClient.waitForTransactionReceipt({ hash: txHashStorageReq });
    if (receiptStorageReq.status !== 'success') {
      throw new Error(`Storage request transaction failed: ${txHashStorageReq}`);
    }

    // Compute file key
    const registry = new TypeRegistry();
    const owner = registry.createType('AccountId20', account.address) as AccountId20;
    const bucketIdH256 = registry.createType('H256', bucketId) as H256;
    const fileKey: H256 = await fileManager.computeFileKey(owner, bucketIdH256, fileLocation);

    // Verify storage request exists on chain
    const storageRequest = await userApi.query.fileSystem.storageRequests(fileKey);
    if (!storageRequest.isSome) {
      throw new Error('Storage request not found on chain');
    }

    const storageRequestData = storageRequest.unwrap();
    console.log(
      'Storage request fingerprint matches:',
      storageRequestData.fingerprint.toString() === fingerprint.toString()
    );

    // Upload file to MSP
    const uploadReceipt = await this.mspService.mspClient.uploadFile(
      bucketId,
      fileKey.toHex(),
      await fileManager.getFileBlob(),
      account.address,
      fileLocation
    );

    if (uploadReceipt.status !== 'success') {
      throw new Error('File upload failed');
    }

    console.log('File uploaded successfully with fileKey:', uploadReceipt.fileKey);

    return {
      fileKey: fileKey.toHex(),
      success: true,
    };
  }

  async downloadFile(fileKey: string): Promise<{ stream: ReadableStream; success: boolean }> {
    const downloadResponse = await this.mspService.mspClient.downloadByKey(fileKey);

    if (downloadResponse.status !== 200) {
      throw new Error(`File download failed with status: ${downloadResponse.status}`);
    }

    console.log('File downloaded successfully');

    return {
      stream: downloadResponse.stream,
      success: true,
    };
  }
}
