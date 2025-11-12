import '@storagehub/api-augment';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { types } from '@storagehub/types-bundle';
import { FileManager, HttpClientConfig, initWasm } from '@storagehub-sdk/core';
import { AuthStatus, HealthStatus, MspClient } from '@storagehub-sdk/msp-client';
import { createReadStream, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { Chain, WalletClient, createWalletClient, defineChain, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from '../../src/config/environment.js';

// --8<-- [end:imports]

async function run() {
  // --8<-- [start:initialize-and-setup]
  // For anything from @storagehub-sdk/core to work, initWasm() is required
  // on top of the file
  await initWasm();

  // --- viem setup ---
  // Define DataHaven chain, as expected by viem
  const chain: Chain = defineChain({
    id: 1288,
    name: 'DataHaven Testnet',
    nativeCurrency: { name: 'Have', symbol: 'HAVE', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://services.datahaven-testnet.network/testnet'] },
    },
  });

  // Define account from a private key
  const account = privateKeyToAccount(config.privateKey as `0x${string}`);
  const address = account.address;

  // Create a wallet client using the defined chain, account, and RPC URL
  const walletClient: WalletClient = createWalletClient({
    chain,
    account,
    transport: http('https://services.datahaven-testnet.network/testnet'),
  });

  // --- Polkadot.js API setup ---
  const provider = new WsProvider('wss://services.datahaven-testnet.network/testnet');
  const polkadotApi: ApiPromise = await ApiPromise.create({
    provider,
    typesBundle: types,
    noInitWarn: true,
  });

  // --- Connect to MSP Client and authenticate account ---
  const baseUrl = 'https://deo-dh-backend.testnet.datahaven-infra.network/';
  const httpConfig: HttpClientConfig = { baseUrl: baseUrl };
  // A temporary authentication token obtained after Sign-In with Ethereum (SIWE).
  // If not yet authenticated, this will remain undefined and the client will operate in read-only mode.
  // Authentication is required for file uploads.
  let sessionToken: string | undefined = undefined;
  const sessionProvider = async () =>
    sessionToken ? ({ token: sessionToken, user: { address: address } } as const) : undefined;
  const mspClient = await MspClient.connect(httpConfig, sessionProvider);

  // Check MSP Health Status
  const mspHealth: HealthStatus = await mspClient.info.getHealth();
  console.log('MSP service health:', mspHealth);

  // Trigger the SIWE (Sign-In with Ethereum) flow.
  // This prompts the connected wallet to sign an EIP-4361 message,
  // which the MSP backend verifies to issue a JWT session token
  const siweSession = await mspClient.auth.SIWE(walletClient);
  console.log('SIWE Session:', siweSession);
  // Store the obtained session token for future authenticated requests
  sessionToken = (siweSession as { token: string }).token;

  // --- File Manager setup ---
  const ownerAccount = '0x00fa35d84a43db75467d2b2c1ed8974aca57223e';
  const bucketId = '0x781a6197f74f9d747b0c08933decbac1a81d6620a6c2f16d9e3b13c84ae44cc8';
  const fileKey = '0x8345bdd406fd9df119757b77c84e16a2e304276372dc21cb37a69a471ee093a6';
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

  // --- Upload file logic ---
  // **PLACEHOLDER FOR STEP 1: UPLOAD FILE TO MSP**

  // Retrieve the file as a binary Blob to prepare it for upload
  const fileBlob = await fileManager.getFileBlob();

  // Upload file to MSP
  const uploadReceipt = await mspClient.files.uploadFile(bucketId, fileKey, fileBlob, ownerAccount, fileName);

  console.log('File upload receipt:', uploadReceipt);

  // **PLACEHOLDER FOR STEP 2: VERIFY SUCCESSFUL UPLOAD**

  if (uploadReceipt.status !== 'upload_successful') {
    throw new Error('File upload to MSP failed');
  }

  // Disconnect the Polkadot API at the very end
  await polkadotApi.disconnect();
}

await run();
