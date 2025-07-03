// pages/index.js

import { useState } from "react";
import { gql } from "@apollo/client";
import graphClient from "../utils/apolloClient";
import {
  getPriceAtTimestamp,
  getCurrentPrice,
  getCoinId,
  findCoinIdByEthereumAddress,
  getCoinsListFromLocalStorage,
} from "../services/coingecko";
import PositionCard from "../components/PositionCard";
import {
  tickToPrice,
  getInitialDepositValueInUSD,
  calculateCurrentPositionValueUSD,
  calculateTotalFeesUSD,
  totalPnlUSD,
  calculateAprApy,
} from "../services/uniswap";

const GET_USER_POSITIONS = gql`
  query GetUserPositions($walletAddress: String!) {
    positions(
      orderBy: pool__createdAtTimestamp
      where: { owner: $walletAddress }
      first: 10
    ) {
      id
      owner
      depositedToken0
      depositedToken1
      liquidity
      feeGrowthInside0LastX128
      feeGrowthInside1LastX128
      collectedFeesToken0
      collectedFeesToken1
      tickLower {
        tickIdx
        price0
        price1
        feeGrowthOutside0X128
        feeGrowthOutside1X128
      }
      tickUpper {
        tickIdx
        price0
        price1
        feeGrowthOutside0X128
        feeGrowthOutside1X128
      }
      pool {
        id
        feeTier
        tick
        sqrtPrice
        token0Price
        token1Price
        feeGrowthGlobal0X128
        feeGrowthGlobal1X128
        collectedFeesUSD
        collectedFeesToken1
        collectedFeesToken0
        liquidity
        token0 {
          id
          symbol
          name
          decimals
        }
        token1 {
          id
          symbol
          name
          decimals
        }
      }
      # This transaction field holds the ID of the creation transaction
      transaction {
        id
        timestamp
      }
    }
  }
`;

function getPositionStatus(position) {
  const { tickLower, tickUpper, pool } = position;
  const currentTick = parseInt(pool.tick, 10);
  const lowerTick = parseInt(tickLower.tickIdx, 10);
  const upperTick = parseInt(tickUpper.tickIdx, 10);

  if (currentTick >= lowerTick && currentTick <= upperTick) {
    return "In Range";
  } else {
    return "Out of Range";
  }
}

const HomePage = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);

  console.log("positions", positions);

  const fetchPositions = async () => {
    if (!walletAddress) return;
    setLoading(true);

    const allCoins = await getCoinsListFromLocalStorage();
    console.log("allCoins", allCoins);

    try {
      const { data } = await graphClient.query({
        query: GET_USER_POSITIONS,
        variables: { walletAddress: walletAddress.toLowerCase() },
      });

      console.log("PositionsYYY", data.positions);

      const formattedPositions = await Promise.all(
        data.positions
          .filter((pos) => pos.id === "1023733")
          .map(async (pos) => {
            console.log("Position: ", pos);
            const createdAtTimestamp = pos.transaction.timestamp;
            const pool = pos.pool;

            // Current Price
            const currentPrice =
              tickToPrice(pool.tick) / 10 ** pool.token0.decimals;

            // Price Range
            let lowerTickPrice = tickToPrice(parseInt(pos.tickLower.tickIdx));
            let upperTickPrice = tickToPrice(parseInt(pos.tickUpper.tickIdx));
            lowerTickPrice = lowerTickPrice / 10 ** pool.token0.decimals;
            upperTickPrice = upperTickPrice / 10 ** pool.token0.decimals;

            // Status
            const positionStatus = getPositionStatus(pos);

            // Initial Deposit Value
            const initialPositionInfo = await getInitialDepositValueInUSD(pos);

            // Current Position Value
            const currentPositionInfo = await calculateCurrentPositionValueUSD(
              pos
            );

            // Fees
            const feesInfo = await calculateTotalFeesUSD(pos);
            console.log("feesInfo", feesInfo);

            // Total PnL
            const totalPnlInUSD = await totalPnlUSD(
              initialPositionInfo.initialTotalDepositUSD,
              currentPositionInfo.currentPositionUSD,
              feesInfo.totalFeesUSD
            );

            // APR/APY
            const aprApy = calculateAprApy(
              feesInfo.totalFeesUSD,
              initialPositionInfo.initialTotalDepositUSD,
              createdAtTimestamp
            );

            //   const usdPriceRange = await getUsdPriceRange(pos, 1);
            //   console.log("usdPriceRange", usdPriceRange);

            //   const [initialPrice0, initialPrice1, currentPrice0, currentPrice1] =
            //     await Promise.all([
            //       getPriceAtTimestamp(pool.token0.id, createdAtTimestamp),
            //       getPriceAtTimestamp(pool.token1.id, createdAtTimestamp),
            //       getCurrentPrice(pool.token0.id),
            //       getCurrentPrice(pool.token1.id),
            //     ]);

            //   const initialDepositUSD =
            //     pos.depositedToken0 * initialPrice0 +
            //     pos.depositedToken1 * initialPrice1;

            //   const currentPositionUSD =
            //     pos.depositedToken0 * currentPrice0 +
            //     pos.depositedToken1 * currentPrice1;

            //   const positionStatus = getPositionStatus(pos);

            // APR/APY and In-range status logic here...

            return {
              ...pos,
              currentPrice,
              lowerTickPrice,
              upperTickPrice,
              createdAtTimestamp,
              initialPositionInfo,
              currentPositionInfo,
              feesInfo,
              totalPnlInUSD,
              aprApy,
              // initialDepositUSD,
              // currentPositionUSD,
              positionStatus,
              // Add other calculated fields here
            };
          })
      );

      setPositions(formattedPositions);
      console.log("formattedPositions", formattedPositions);
    } catch (error) {
      console.error("Error fetching positions:", error);
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Uniswap V3 Position Viewer</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter wallet address"
          className="input input-bordered w-full"
        />
        <button onClick={fetchPositions} className="btn btn-primary">
          {loading ? "Fetching..." : "Fetch Positions"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {positions.map((position) => (
          <PositionCard key={position.id} position={position} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;
