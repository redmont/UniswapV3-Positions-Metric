import { Token } from "@uniswap/sdk-core";
import { Pool, Position } from "@uniswap/v3-sdk";
import { ethers, BigNumber } from "ethers";
//import { tickToPrice } from "@uniswap/v3-sdk";
import { getCurrentPrice, getPriceAtTimestamp } from "../services/coingecko";

export function tickToPrice(tick) {
  return Math.pow(1.0001, tick);
}

export const getInitialDepositValueInUSD = async (position) => {
  const { depositedToken0, depositedToken1, pool } = position;
  const { token0, token1 } = pool;
  const { timestamp } = position.transaction;

  const creationDate = new Date(timestamp * 1000);
  const dateString = `${creationDate.getDate()}-${
    creationDate.getMonth() + 1
  }-${creationDate.getFullYear()}`;

  // wait for 1 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const initialToken0PriceinUSD = await getPriceAtTimestamp(
    token0.id,
    dateString
  );
  // wait for 1 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const initialToken1PriceinUSD = await getPriceAtTimestamp(
    token1.id,
    dateString
  );

  const initialToken0InUSD = depositedToken0 * initialToken0PriceinUSD;
  const initialToken1InUSD = depositedToken1 * initialToken1PriceinUSD;

  console.log("initialToken0InUSD", initialToken0InUSD);
  console.log("initialToken1InUSD", initialToken1InUSD);
  const initialTotalDepositUSD = initialToken0InUSD + initialToken1InUSD;
  return {
    initialTotalDepositUSD,
    initialToken0InUSD,
    initialToken1InUSD,
    depositedToken0,
    depositedToken1,
    initialToken0PriceinUSD,
    initialToken1PriceinUSD,
  };
};

export const calculateCurrentPositionValueUSD = async (
  positionData,
  chainId = 1
) => {
  const { pool, liquidity, tickLower, tickUpper } = positionData;

  // 1. Create Token instances
  const token0 = new Token(
    chainId,
    pool.token0.id,
    parseInt(pool.token0.decimals)
  );
  const token1 = new Token(
    chainId,
    pool.token1.id,
    parseInt(pool.token1.decimals)
  );

  // 2. Create a Pool instance
  const poolObject = new Pool(
    token0,
    token1,
    parseInt(pool.feeTier),
    pool.sqrtPrice,
    liquidity,
    parseInt(pool.tick)
  );

  // 3. Create a Position instance
  const positionObject = new Position({
    pool: poolObject,
    liquidity: liquidity,
    tickLower: parseInt(tickLower.tickIdx),
    tickUpper: parseInt(tickUpper.tickIdx),
  });

  // 4. Get the current amounts of each token
  const amount0 = parseFloat(positionObject.amount0.toSignificant(6));
  const amount1 = parseFloat(positionObject.amount1.toSignificant(6));

  console.log("ZZZamount0", amount0, "amount1", amount1);

  if (amount0 === 0 && amount1 === 0) {
    return {
      currentPositionUSD: 0,
      value0: 0,
      value1: 0,
      amount0: 0,
      amount1: 0,
    };
  }

  // 5. Fetch the live USD prices
  // wait for 1 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const price0 = await getCurrentPrice(pool.token0.id);
  // wait for 1 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const price1 = await getCurrentPrice(pool.token1.id);

  console.log("ZZZprice0", price0, "price1", price1);

  // 6. Calculate the total USD value
  const value0 = amount0 * price0;
  const value1 = amount1 * price1;

  const currentPositionUSD = value0 + value1;

  return { currentPositionUSD, value0, value1, amount0, amount1 };
};

export const calculateTotalFeesUSD = async (positionData) => {
  const {
    pool,
    liquidity,
    tickLower,
    tickUpper,
    feeGrowthInside0LastX128,
    feeGrowthInside1LastX128,
    collectedFeesToken0,
    collectedFeesToken1,
  } = positionData;

  const Q128 = BigInt(2) ** BigInt(128);

  // --- 1. Calculate Unclaimed Fees Manually ---

  // Parse all big numbers
  const liquidityBN = BigInt(liquidity);
  const feeGrowthGlobal0X128BN = BigInt(pool.feeGrowthGlobal0X128);
  const feeGrowthGlobal1X128BN = BigInt(pool.feeGrowthGlobal1X128);
  const feeGrowthInside0LastX128BN = BigInt(feeGrowthInside0LastX128);
  const feeGrowthInside1LastX128BN = BigInt(feeGrowthInside1LastX128);

  // Fee growth outside the ticks
  const feeGrowthOutside0X128_lower = BigInt(tickLower.feeGrowthOutside0X128);
  const feeGrowthOutside0X128_upper = BigInt(tickUpper.feeGrowthOutside0X128);
  const feeGrowthOutside1X128_lower = BigInt(tickLower.feeGrowthOutside1X128);
  const feeGrowthOutside1X128_upper = BigInt(tickUpper.feeGrowthOutside1X128);

  // This formula calculates the total fee growth for the position's range
  let feeGrowthInside0X128 =
    feeGrowthGlobal0X128BN -
    feeGrowthOutside0X128_lower -
    feeGrowthOutside0X128_upper;
  let feeGrowthInside1X128 =
    feeGrowthGlobal1X128BN -
    feeGrowthOutside1X128_lower -
    feeGrowthOutside1X128_upper;

  // This calculates the fees earned since the last collection
  const unclaimedFees0X128 =
    (liquidityBN * (feeGrowthInside0X128 - feeGrowthInside0LastX128BN)) / Q128;
  const unclaimedFees1X128 =
    (liquidityBN * (feeGrowthInside1X128 - feeGrowthInside1LastX128BN)) / Q128;

  console.log("unclaimedFees0X128", unclaimedFees0X128);
  console.log("unclaimedFees1X128", unclaimedFees1X128);
  console.log("pool.token0.decimals", pool.token0.decimals);
  console.log("pool.token1.decimals", pool.token1.decimals);
  // Convert from fixed-point to human-readable format
  const unclaimedFees0 =
    Number(unclaimedFees0X128) / Number(10n ** BigInt(pool.token0.decimals));
  const unclaimedFees1 =
    Number(unclaimedFees1X128) / Number(10n ** BigInt(pool.token1.decimals));

  console.log("unclaimedFees0", unclaimedFees0);
  console.log("unclaimedFees1", unclaimedFees1);

  // --- 2. Convert to USD ---
  // wait for 1 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const price0 = await getCurrentPrice(pool.token0.id);
  // wait for 1 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const price1 = await getCurrentPrice(pool.token1.id);

  console.log("price0", price0);
  console.log("price1", price1);

  const unclaimedFeesUSD = unclaimedFees0 * price0 + unclaimedFees1 * price1;
  const token0FeesCollected = parseFloat(collectedFeesToken0);
  const token1FeesCollected = parseFloat(collectedFeesToken1);
  console.log("IIIIIIIItoken0FeesCollected", token0FeesCollected);
  console.log("XXXXXXXXtoken1FeesCollected", token1FeesCollected);
  const claimedFeesUSD =
    token0FeesCollected * price0 + token1FeesCollected * price1;

  const totalFeesUSD = unclaimedFeesUSD + claimedFeesUSD;

  return {
    unclaimedFees0,
    unclaimedFees1,
    collectedFeesToken0,
    collectedFeesToken1,
    totalFeesUSD,
    unclaimedFeesUSD,
    claimedFeesUSD,
  };
};

export const totalPnlUSD = async (InitialUSD, CurrentUSD, TotalFeesUSD) => {
  return CurrentUSD - InitialUSD + TotalFeesUSD;
};

export const calculateAprApy = (
  totalFeesUSD,
  initialDepositUSD,
  creationTimestamp
) => {
  // Prevent division by zero if there was no initial deposit
  if (initialDepositUSD === 0) {
    return { apr: 0, apy: 0 };
  }

  // Calculate how many days the position has been open
  const positionAgeInSeconds = Date.now() / 1000 - parseInt(creationTimestamp);
  const positionAgeInDays = positionAgeInSeconds / (60 * 60 * 24);

  // If the position is less than a day old or has a negative age, return 0
  if (positionAgeInDays <= 0) {
    return { apr: 0, apy: 0 };
  }

  // --- Calculate APR ---
  // (Total Fees / Initial Deposit) = Return rate for the entire period
  // We annualize it by dividing by the number of days and multiplying by 365.
  const apr =
    (totalFeesUSD / initialDepositUSD) * (365 / positionAgeInDays) * 100;

  // --- Calculate APY (assuming daily compounding) ---
  // First, find the effective daily rate of return
  const dailyRate = totalFeesUSD / initialDepositUSD / positionAgeInDays;
  // Then, compound that daily rate over 365 days
  const apy = (Math.pow(1 + dailyRate, 365) - 1) * 100;

  return {
    apr: isFinite(apr) ? apr : 0, // Ensure we don't return Infinity or NaN
    apy: isFinite(apy) ? apy : 0,
  };
};
