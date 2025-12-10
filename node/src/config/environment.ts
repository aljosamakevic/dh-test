import 'dotenv/config';

export const config = {
  privateKey: process.env.PRIVATE_KEY!,
  bspSeedPhrase: process.env.BSP_SEED_PHRASE!,
  alithPrivateKey: '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133' as `0x${string}`,
  filesystemContractAddress: '0x0000000000000000000000000000000000000404' as `0x${string}`,
  stagenet: {
    rpcUrl: process.env.STAGENET_RPC_URL!,
    wsUrl: process.env.STAGENET_WS_URL!,
    mspUrl: process.env.STAGENET_MSP_URL!,
  },
};

// Validate required environment variables
if (!config.privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}
