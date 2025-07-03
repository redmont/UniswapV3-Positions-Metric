// pages/index.js

import { useState } from "react";
import { gql } from "@apollo/client";
import graphClient from "../utils/apolloClient";
import {
  getCoinsListFromLocalStorage,
  getCoinsList,
} from "../services/coingecko";
import PositionCard from "../components/PositionCard";
import {
  tickToPrice,
  getInitialDepositValueInUSD,
  calculateCurrentPositionValueUSD,
  calculateTotalFeesUSD,
  totalPnlUSD,
  calculateAprApy,
  GET_USER_POSITIONS,
  EVENTS_HISTORY_QUERY,
} from "../services/uniswap";

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
  const [positionsList, setPositionsList] = useState([]);
  const [loading, setLoading] = useState(false);

  console.log("positions", positions);
  console.log("positionsList", positionsList);

  const fetchPositions = async () => {
    if (!walletAddress) return;
    setLoading(true);

    const allCoins = await getCoinsList();
    console.log("allCoins", allCoins);

    try {
      const { data } = await graphClient.query({
        query: GET_USER_POSITIONS,
        variables: { walletAddress: walletAddress.toLowerCase() },
      });

      console.log("PositionsYYY", data.positions);

      //   const { data2 } = await graphClient.query({
      //     query: EVENTS_HISTORY_QUERY,
      //     variables: {
      //       poolAddress:
      //         "0xf763bb342eb3d23c02ccb86312422fe0c1c17e94".toLowerCase(),
      //       userAddress:
      //         "0x365A7552E71f8127a0d6c3d48632f5f9Ab210ADa".toLowerCase(),
      //     },
      //   });

      //   console.log("EventsYYY", data2);
      //   return;

      const positionList = data.positions.map((pos) => {
        const isActive = getPositionStatus(pos) === "In Range";
        return {
          ...pos,
          isActive,
        };
      });
      setPositionsList(positionList);
    } catch (error) {
      console.error("Error fetching positions:", error);
    }

    setLoading(false);
  };

  const getPositionInfo = async (positionId) => {
    console.log("positionId", positionId);
    setLoading(true);
    const formattedPositions = await Promise.all(
      positionsList
        .filter((pos) => pos.id === positionId)
        .map(async (pos) => {
          console.log("Position: ", pos);
          const createdAtTimestamp = pos.transaction.timestamp;
          const pool = pos.pool;

          // Price Range
          let lowerTickPrice = tickToPrice(parseInt(pos.tickLower.tickIdx));
          let upperTickPrice = tickToPrice(parseInt(pos.tickUpper.tickIdx));
          lowerTickPrice =
            lowerTickPrice *
            (10 ** pool.token0.decimals / 10 ** pool.token1.decimals);
          upperTickPrice =
            upperTickPrice *
            (10 ** pool.token0.decimals / 10 ** pool.token1.decimals);

          // Current Price
          const currentPrice = pool.token1Price;

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
            positionStatus,
          };
        })
    );
    setLoading(false);

    setPositions(formattedPositions);
    console.log("formattedPositions", formattedPositions);
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
          style={{ width: "300px" }}
        />
        <button onClick={fetchPositions} className="btn btn-primary">
          {loading ? "Fetching..." : "Fetch Positions"}
        </button>
      </div>

      {positionsList?.length > 0 && (
        <div>
          <h1 className="text-2xl font-bold mb-4">Positions</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <h3>Active Positions: </h3>

            {positionsList
              .filter((position) => position.isActive)
              .map((position) => (
                <button
                  style={{ marginRight: 6 }}
                  key={position.id}
                  onClick={() => getPositionInfo(position.id)}
                >
                  {position.id}{" "}
                </button>
              ))}
            <h3>InActive Positions: </h3>

            {positionsList
              .filter((position) => !position.isActive)
              .map((position) => (
                <button
                  style={{ marginRight: 6 }}
                  key={position.id}
                  onClick={() => getPositionInfo(position.id)}
                >
                  {position.id}
                </button>
              ))}
          </div>
        </div>
      )}
      {loading && <p>Loading...</p>}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
