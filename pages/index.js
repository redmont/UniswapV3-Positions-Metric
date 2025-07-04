// pages/index.js

import { useState } from "react";
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
  getTotalFeesUSD,
  totalPnlUSD,
  calculateAprApy,
  GET_USER_POSITIONS1,
  GET_USER_POSITIONS2,
  getPositionStatus,
  getWithdrawalInfo,
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
    setPositionsList([]);
    setPositions([]);
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
    setPositions([]);
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

          const withdrawalInfo = await getWithdrawalInfo(pos);

          // Total PnL
          const totalPnlInUSD = await totalPnlUSD(
            pos.amountDepositedUSD,
            currentPositionInfo.currentPositionUSD,
            withdrawalInfo.totalWithdrawnUSD,
            feesInfo.totalEarnedFeesUSD
          );

          // APR/APY
          const aprApy = calculateAprApy(
            feesInfo.totalEarnedFeesUSD,
            initialPositionInfo.initialTotalDepositUSD,
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
            withdrawalInfo,
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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "80%",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: "60%" }}>
          <h1 className="text-2xl font-bold mb-4">
            Uniswap V3 Position Viewer
          </h1>
          <div className="flex gap-2 mb-4" style={{ flexDirection: "row" }}>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter wallet address"
              className="input input-bordered w-full"
              style={{ width: "300px" }}
            />
            <button
              onClick={fetchPositions}
              className="btn btn-primary"
              style={{ marginRight: 10, marginLeft: 10 }}
            >
              {loading ? "Fetching..." : "Fetch Positions"}
            </button>
            <br />
            <br />
            Sample Wallets:
            <br />
            0xbf0e2de41e3b7f0c7c72e11f04760b787f082460
            0xf02f301f14f4ae52df21da91bab40993a3e3d07c
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginRight: "10%",
            width: "60%",
          }}
        >
          <p>
            Hi <b>Davis</b>, please keep in mind:
          </p>
          <span>
            1. I am fetching the current Price and historical price of assets
            from the <b>free coingecko API</b>. The free version is slow and
            does not give you the exact price of the asset, but it gives you an
            approximate price.
          </span>
          <br />
          <span>
            2. The <b>unclaimed Fee</b> data might be inaccurate for positions
            (and subsequent calculations). This is a known issue in the Uniswap
            V3 subgraphs. All subgraphs data are not reliable and can be
            outdated. Correct way is to directly index chain data. But I'm using
            it for this demo since it's free.
          </span>
        </div>
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
