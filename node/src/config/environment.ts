import 'dotenv/config';

export const config = {
  privateKey: process.env.PRIVATE_KEY!,
  filesystemContractAddress: '0x0000000000000000000000000000000000000404' as `0x${string}`,
};

// Validate required environment variables
if (!config.privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}
