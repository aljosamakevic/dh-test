import '@storagehub/api-augment';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { types } from '@storagehub/types-bundle';
import { HttpClientConfig, initWasm } from '@storagehub-sdk/core';
import { AuthStatus, DownloadResult, HealthStatus, MspClient } from '@storagehub-sdk/msp-client';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { Chain, WalletClient, createWalletClient, defineChain, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { config } from '../config/environment.js';

async function run() {
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
  // Authentication is required for file downloads.
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

  // --- Upload file logic ---
  // **PLACEHOLDER FOR STEP 1: DOWNLOAD FILE FROM MSP CLIENT**

  const fileKey = '0x8345bdd406fd9df119757b77c84e16a2e304276372dc21cb37a69a471ee093a6';

  const downloadResponse: DownloadResult = await mspClient.files.downloadFile(fileKey);

  console.log('Download Response:', downloadResponse);
  // Check if the download response was successful
  if (downloadResponse.status !== 200) {
    throw new Error(`Download failed with status: ${downloadResponse.status}`);
  }

  // **PLACEHOLDER FOR STEP 2: SAVE DOWNLOADED FILE**

  // Define the local path where the downloaded file will be saved
  // Here it is resolved relative to the current module’s URL.
  const downloadPath = new URL(
    './files/helloworld_downloaded.txt', // make sure the file extension matches the original file
    import.meta.url
  ).pathname;

  // Create a writable stream to the target file path
  // This stream will receive binary data chunks and write them to disk.
  const writeStream = createWriteStream(downloadPath);

  // Convert the Web ReadableStream into a Node.js-readable stream
  const readableStream = Readable.fromWeb(downloadResponse.stream as any);

  // Pipe the readable (input) stream into the writable (output) stream
  // This transfers the file data chunk by chunk and closes the write stream automatically
  // when finished.
  readableStream.pipe(writeStream);

  console.log('Downloaded file saved to:', downloadPath);

  // Disconnect the Polkadot API at the very end
  await polkadotApi.disconnect();
}

await run();
