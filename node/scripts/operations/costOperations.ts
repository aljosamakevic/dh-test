// --8<-- [start:imports]
import { formatEther } from 'viem';
import { polkadotApi, publicClient } from '../services/clientService';
import { PaymentStreamInfo, PaymentStreamsResponse } from '@storagehub-sdk/msp-client';
import { signer } from '../services/clientService';
// --8<-- [end:imports]

//--8<-- [start:calculate-time-remaining]
interface TimeRemaining {
  ticks: bigint;
  seconds: bigint;
  formatted: string;
}

const TICK_DURATION_SECONDS = 6n; // 6 seconds per block
const DECIMALS = 18;

const calculateTimeRemaining = (balanceInWei: bigint, streams: PaymentStreamsResponse): TimeRemaining => {
  // Sum all costPerTick values
  const totalCostPerTick = streams.streams.reduce(
    (sum: bigint, stream: PaymentStreamInfo) => sum + BigInt(stream.costPerTick),
    0n
  );

  if (totalCostPerTick === 0n) {
    return { ticks: 0n, seconds: 0n, formatted: 'No active streams' };
  }

  // Ticks remaining = balance / total cost per tick
  const ticksRemaining = balanceInWei / totalCostPerTick;
  const secondsRemaining = ticksRemaining * TICK_DURATION_SECONDS;

  return {
    ticks: ticksRemaining,
    seconds: secondsRemaining,
    formatted: formatDuration(secondsRemaining),
  };
};
//--8<-- [end:calculate-time-remaining]

// --8<-- [start:format-duration]
const formatDuration = (totalSeconds: bigint): string => {
  const SECONDS_PER_MINUTE = 60n;
  const SECONDS_PER_HOUR = 3600n;
  const SECONDS_PER_DAY = 86400n;
  const SECONDS_PER_MONTH = 2629746n; // ~30.44 days
  const SECONDS_PER_YEAR = 31556952n; // ~365.25 days

  const years = totalSeconds / SECONDS_PER_YEAR;
  const months = (totalSeconds % SECONDS_PER_YEAR) / SECONDS_PER_MONTH;

  if (years > 0n) {
    return `${years} years, ${months} months`;
  }

  const days = totalSeconds / SECONDS_PER_DAY;
  const hours = (totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR;

  if (days > 0n) {
    return `${days} days, ${hours} hours`;
  }

  const minutes = totalSeconds / SECONDS_PER_MINUTE;
  return `${minutes} minutes`;
};
// --8<-- [end:format-duration]

// --8<-- [start:get-balance]
const getBalance = async (address: `0x${string}`): Promise<bigint> => {
  // Query balance
  // const balance = parseFloat(formatEther(await publicClient.getBalance({ address })));
  const balanceWei = await publicClient.getBalance({ address });
  console.log(`Address: ${address}`);
  console.log(`Balance: ${balanceWei} (wei)`);
  console.log(`Balance: ${Number(formatEther(balanceWei))} (MOCK)`);

  return balanceWei;
};
// --8<-- [end:get-balance]

// --8<-- [start:is-insolvent]
const isInsolvent = async (address: string) => {
  // Query if user is labelled as insolvent by the network
  const userWithoutFundsResponse = await polkadotApi.query.paymentStreams.usersWithoutFunds(address);
  console.log(`User ${address} without funds response:`, userWithoutFundsResponse.toHuman());
  const isInsolvent = userWithoutFundsResponse.isSome;
  return isInsolvent;
};
// --8<-- [end:is-insolvent]

// --8<-- [start:pay-outstanding-debt]
const payOutstandingDebt = async (providerIds: string[]) => {
  // Create and send transaction to pay outstanding debt
  const confirmTx = polkadotApi.tx.paymentStreams.payOutstandingDebt(providerIds);

  await new Promise<void>((resolve, reject) => {
    confirmTx
      .signAndSend(signer, ({ status, dispatchError }) => {
        console.log('Paying outstanding debt...');
        if (status.isFinalized) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              // for module errors, we have the section and the name
              const decoded = polkadotApi.registry.findMetaError(dispatchError.asModule);
              reject(new Error(`${decoded.section}.${decoded.method}: ${decoded.docs.join(' ')}`));
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              reject(new Error(dispatchError.toString()));
            }
          } else {
            console.log('Outstanding debt paid successfully!');
            resolve();
          }
        }
      })
      .catch(reject);
  });
};
// --8<-- [end:pay-outstanding-debt]

// --8<-- [start:clear-insolvent-flag]
const clearInsolventFlag = async () => {
  // Create and send transaction to clear insolvent flag
  const confirmTx = polkadotApi.tx.paymentStreams.clearInsolventFlag();

  await new Promise<void>((resolve, reject) => {
    confirmTx
      .signAndSend(signer, ({ status, dispatchError }) => {
        console.log('Clearing insolvent flag...');
        if (status.isFinalized) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              // for module errors, we have the section and the name
              const decoded = polkadotApi.registry.findMetaError(dispatchError.asModule);
              reject(new Error(`${decoded.section}.${decoded.method}: ${decoded.docs.join(' ')}`));
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              reject(new Error(dispatchError.toString()));
            }
          } else {
            console.log('Insolvent flag cleared successfully!');
            resolve();
          }
        }
      })
      .catch(reject);
  });
};
// --8<-- [end:clear-insolvent-flag]

export { calculateTimeRemaining, formatDuration, getBalance, isInsolvent, payOutstandingDebt, clearInsolventFlag };
