// pages/index.js

import { useState } from "react";
import { gql } from "@apollo/client";
import {
  graphClient1,
  graphClient2,
  mergePositionData,
} from "../utils/apolloClient";
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
  getTotalFeesUSD,
  totalPnlUSD,
  calculateAprApy,
  GET_USER_POSITIONS1,
  GET_USER_POSITIONS2,
  EVENTS_HISTORY_QUERY,
  getPositionStatus,
} from "../services/uniswap";

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
      const [result1, result2] = await Promise.all([
        graphClient1.query({
          query: GET_USER_POSITIONS1,
          variables: { walletAddress: walletAddress.toLowerCase() },
        }),
        graphClient2.query({
          query: GET_USER_POSITIONS2,
          variables: { walletAddress: walletAddress.toLowerCase() },
        }),
      ]);

      const data1 = result1.data;
      const data2 = result2.data;
      console.log("PositionsYYY", data1.positions);
      console.log("PositionsYYY", data2.positions);

      const positions = mergePositionData(data1.positions, data2.positions);
      console.log("positionsFFFFFF", positions);

      const positionList = positions.map((pos) => {
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

          // is Active
          const isActive = currentPositionInfo.currentPositionUSD > 0;

          // Fees
          const feesInfo = await getTotalFeesUSD(pos);
          console.log("feesInfo", feesInfo);

          // Total PnL
          const totalPnlInUSD = await totalPnlUSD(
            pos.amountDepositedUSD,
            currentPositionInfo.currentPositionUSD,
            pos.amountWithdrawnUSD,
            feesInfo.totalEarnedFeesUSD
          );

          // APR/APY
          const aprApy = calculateAprApy(
            feesInfo.totalEarnedFeesUSD,
            pos.amountDepositedUSD,
            createdAtTimestamp
          );

          return {
            ...pos,
            isActive,
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
            <h3>In Range Positions: </h3>

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
            <h3>Out of Range Positions: </h3>

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
