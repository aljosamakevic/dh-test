export type ChainData = {
  id: number;
  name: string;
  rpcUrl: string;
  wsUrl: string;
  mspUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
};
