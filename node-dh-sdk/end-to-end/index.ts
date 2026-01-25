import { DataHavenSDK, ChainKey } from '@datahaven-xyz/sdk-internal';

// 1. Initialize SDK
const sdk = new DataHavenSDK({
  network: ChainKey.Testnet,
  privateKey: process.env.PRIVATE_KEY!,
  mspConfig: {
    mspBaseUrl: 'https://deo-dh-backend.testnet.datahaven-infra.network',
  },
});

await sdk.initialize();
console.log('Connected with wallet:', sdk.getAddress());

// 2. Create a bucket
const bucket = await sdk.createBucket('my-documents');

// 3. Upload a file
const metadata = await bucket.upload({
  srcFilePath: './document.pdf',
  dstFilePath: '/documents/important.pdf',
  onProgress: (event) => {
    console.log('Upload progress:', event.type);
  },
});
console.log('File uploaded! Key:', metadata.fileKey.toHex());

// 4. List files
const files = await bucket.listFiles('/documents');
files.tree.children.forEach((file) => {
  console.log(`${file.name} - ${file.size} bytes`);
});

// 5. Download a file
await bucket.download({
  fileKey: metadata.fileKey.toHex(),
  dstFilePath: './downloaded.pdf',
});
console.log('Download complete!');
