import { DataHavenSDK, ChainKey } from '@datahaven-xyz/sdk-internal';
import 'dotenv/config';
// import { buildGasTxOpts } from './operations/txOperations';

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
// const gasTxOpts = await buildGasTxOpts();
const bucket = await sdk.createBucket('sdk-v2-bucket');

// 3. Upload a file
const metadata = await bucket.upload({
  srcFilePath: './files/helloworld.txt',
  dstFilePath: '/documents/helloworld.txt',
  onProgress: (event) => {
    console.log('Upload progress:', event.type);
  },
});
console.log('File uploaded! Key:', metadata.fileKey.toHex());

// 4. List files
const files = await bucket.listFiles('/documents');
console.log("Files in '/documents':", files);
files.tree.children.forEach((file) => {
  console.log(`${file.name} - ${file.size} bytes`);
});

// 5. Download a file
await bucket.download({
  fileKey: metadata.fileKey.toHex(),
  dstFilePath: './files/downloaded/helloworld.txt',
});
console.log('Download complete!');
