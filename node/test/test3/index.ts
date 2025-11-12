import '@storagehub/api-augment';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';
import { AccountId20, H256 } from '@polkadot/types/interfaces';
import { types } from '@storagehub/types-bundle';
import { FileManager, initWasm } from '@storagehub-sdk/core';
import { createReadStream, statSync } from 'node:fs';
import { Readable } from 'node:stream';

async function run() {
  // For anything from @storagehub-sdk/core to work, initWasm() is required
  // on top of the file
  await initWasm();

  // --- Polkadot.js API setup ---
  const provider = new WsProvider('wss://services.datahaven-testnet.network/testnet'); //** */
  const polkadotApi: ApiPromise = await ApiPromise.create({
    provider,
    typesBundle: types,
    noInitWarn: true,
  });

  // --- File Manager setup ---
  // Specify the file name of the file to be uploaded
  const fileName = 'helloworld.txt'; // Example: filename.jpeg

  // Specify the file path of the file to be uploaded relative to the location of your index.ts file
  const filePath = new URL(`./files/${fileName}`, import.meta.url).pathname;
  const fileSize = statSync(filePath).size;

  // Initialize a FileManager instance with file metadata and a readable stream.
  // The stream converts the local file into a Web-compatible ReadableStream,
  // which the SDK uses to handle file uploads to the network
  const fileManager = new FileManager({
    size: fileSize,
    stream: () => Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>,
  });
  const fingerprint = await fileManager.getFingerprint();

  // --- Verify storage request logic ---
  // **PLACEHOLDER FOR STEP 1: COMPUTE THE FILE KEY**

  // Compute file key
  const ownerAccount = '0x00fa35d84a43db75467d2b2c1ed8974aca57223e';
  const bucketId = '0xdd2148ff63c15826ab42953a9d214770e6c2a73b22b83d28819a1777ab9d1322';

  const registry = new TypeRegistry();
  const owner = registry.createType('AccountId20', ownerAccount) as AccountId20;
  const bucketIdH256 = registry.createType('H256', bucketId) as H256;
  const fileKey = await fileManager.computeFileKey(owner, bucketIdH256, fileName);
  console.log('Computed file key:', fileKey.toHex());

  // **PLACEHOLDER FOR STEP 2: RETRIEVE STORAGE REQUEST DATA**

  // Verify storage request on chain
  const storageRequest = await polkadotApi.query.fileSystem.storageRequests(fileKey);
  if (!storageRequest.isSome) {
    throw new Error('Storage request not found on chain');
  }

  // **PLACEHOLDER FOR STEP 3: READ STORAGE REQUEST DATA**

  // Read the storage request data
  const storageRequestData = storageRequest.unwrap();
  console.log('Storage request data:', storageRequestData);
  console.log('Storage request bucketId:', storageRequestData.bucketId.toString());
  console.log(
    'Storage request fingerprint should be the same as initial fingerprint',
    storageRequestData.fingerprint.toString() === fingerprint.toString()
  );

  // Disconnect the Polkadot API at the very end
  await polkadotApi.disconnect();
}

await run();
