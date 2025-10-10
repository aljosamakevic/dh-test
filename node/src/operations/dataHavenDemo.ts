import { initWasm } from '@storagehub-sdk/core';

import { ClientService } from '../services/clientService.js';
import { MspService } from '../services/mspService.js';
import { BucketOperations } from './bucketOperations.js';
import { FileOperations } from './fileOperations.js';
import { FileUtils } from '../utils/fileUtils.js';
import { DEMO_CONFIG } from '../types/index.js';

export class DataHavenDemo {
  private clientService!: ClientService;
  private mspService!: MspService;
  private bucketOps!: BucketOperations;
  private fileOps!: FileOperations;

  async initialize(): Promise<void> {
    console.log('🚀 Initializing DataHaven Demo...');

    // Initialize WASM
    await initWasm();
    console.log('✅ WASM initialized');

    // Create services
    this.clientService = await ClientService.create();
    this.mspService = await MspService.create();
    console.log('✅ Services created');

    // Create operation instances
    this.bucketOps = new BucketOperations(this.clientService, this.mspService);
    this.fileOps = new FileOperations(this.clientService, this.mspService);

    // Display MSP info
    const mspInfo = await this.mspService.getMspInfo();
    console.log('📡 Connected to MSP:', mspInfo.mspId);
    console.log('📍 Using address:', this.clientService.address);
  }

  async runDemo(): Promise<void> {
    try {
      console.log('\n📦 Creating bucket...');
      const bucketId = await this.bucketOps.createBucket(DEMO_CONFIG.bucketName);

      console.log('\n📤 Uploading file...');
      const filePath = FileUtils.getFilePath(DEMO_CONFIG.testFileName);
      const uploadResult = await this.fileOps.uploadFile(bucketId, filePath, DEMO_CONFIG.testFileName);

      console.log('\n📥 Downloading file...');
      const downloadResult = await this.fileOps.downloadFile(uploadResult.fileKey);

      console.log('\n💾 Saving downloaded file...');
      const downloadPath = FileUtils.getDownloadPath(DEMO_CONFIG.testFileName);
      await FileUtils.saveStreamToFile(downloadResult.stream, downloadPath);

      console.log('\n✅ Demo completed successfully!');
    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');
    await this.clientService.disconnect();
    console.log('✅ Cleanup completed');
  }
}
