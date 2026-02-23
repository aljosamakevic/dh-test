import { toHex } from 'viem';
import { chain, NETWORK } from './config/networks.js';
import { publicClient, walletClient, account, address } from './services/clientService.js';
import fileSystemAbi from './abis/FileSystemABI.json' with { type: 'json' };

// Read (no transaction)
const bucketId = await publicClient.readContract({
  address: NETWORK.filesystemContractAddress,
  abi: fileSystemAbi,
  functionName: 'deriveBucketId',
  args: [address, toHex('my-bucket')],
});

// Write (submits a transaction)
const txHash = await walletClient.writeContract({
  account,
  address: NETWORK.filesystemContractAddress,
  abi: fileSystemAbi,
  chain,
  functionName: 'createBucket',
  args: [
    '0x0000000000000000000000000000000000000000000000000000000000000001',
    toHex('my-bucket'),
    false,
    '0x628a23c7aa64902e13f63ffdd0725e07723745f84cabda048d901020d200da1e',
  ],
});
