// components/PositionCard.js

const PositionCard = ({ position }) => (
  <div className="card bg-base-100 shadow-xl">
    <div className="card-body">
      <h2 className="card-title">
        Position ID: {position.id} ({position.isActive ? "Active" : "Inactive"},{" "}
        {position.positionStatus})
      </h2>

      <p>
        <strong>Tokens:</strong> {position.pool.token0.symbol} /{" "}
        {position.pool.token1.symbol}
        <br />
        <strong>Contract Address:</strong> {position.pool.token0.id} /{" "}
        {position.pool.token1.id}
      </p>
      <p>
        <strong>Fee Tier:</strong> {position.pool.feeTier / 10000}%
      </p>
      <p>
        <strong>Position Price Range:</strong> {position.lowerTickPrice} -{" "}
        {position.upperTickPrice}
      </p>
      <p>
        <strong>
          Current Price (${position.pool.token0.symbol}/$
          {position.pool.token1.symbol}):
        </strong>{" "}
        {position.currentPrice}
      </p>
      <p>
        <strong>Position Status:</strong> {position.positionStatus}
      </p>

      <p>
        <strong>Initial:</strong>{" "}
        <li>
          <strong>Amount:</strong>{" "}
          {position.initialPositionInfo.depositedToken0}{" "}
          {position.pool.token0.symbol} +{" "}
          {position.initialPositionInfo.depositedToken1}{" "}
          {position.pool.token1.symbol}
        </li>
        <li>
          <strong>Prices of Assets at Deposit:</strong>{" "}
          {position.initialPositionInfo.initialToken0PriceinUSD}{" "}
          {position.pool.token0.symbol}/USD ,{" "}
          {position.initialPositionInfo.initialToken1PriceinUSD}{" "}
          {position.pool.token1.symbol}/USD
        </li>
        <li>
          <strong>Value of Assets at Deposit (in USD):</strong>{" "}
          {position.initialPositionInfo.initialToken0InUSD}{" "}
          {position.pool.token0.symbol} +{" "}
          {position.initialPositionInfo.initialToken1InUSD}{" "}
          {position.pool.token1.symbol}
        </li>
        <li>
          <strong>Total (in USD):</strong>{" "}
          {position.initialPositionInfo.initialTotalDepositUSD}{" "}
        </li>
      </p>
      <p>
        <strong>Current:</strong>{" "}
        <li>
          <strong>Amount:</strong> {position.currentPositionInfo.amount0}{" "}
          {position.pool.token0.symbol} + {position.currentPositionInfo.amount1}{" "}
          {position.pool.token1.symbol}
        </li>
        <li>
          <strong>Price (in USD):</strong> {position.currentPositionInfo.price0}{" "}
          {position.pool.token0.symbol}/USD +{" "}
          {position.currentPositionInfo.price1} {position.pool.token1.symbol}
          /USD
        </li>
        <li>
          <strong>Total (in USD):</strong>{" "}
          {position.currentPositionInfo.currentPositionUSD}{" "}
        </li>
      </p>
      <p>
        <strong>Fees:</strong>{" "}
        {position.feesInfo?.unclaimedFees0 >= 0 && (
          <>
            <li>
              <strong>Unclaimed Fees:</strong>{" "}
              {position.feesInfo?.unclaimedFees0} {position.pool.token0.symbol}{" "}
              + {position.feesInfo?.unclaimedFees1}{" "}
              {position.pool.token1.symbol}
            </li>
            <li>
              <strong>Unclaimed Fees (in USD):</strong>{" "}
              {position.feesInfo?.unclaimedFeesUSD}{" "}
            </li>
          </>
        )}
        <li>
          <strong>Claimed Fees:</strong>{" "}
          {position.feesInfo?.totalClaimedFeesToken0}{" "}
          {position.pool.token0.symbol} +{" "}
          {position.feesInfo?.totalClaimedFeesToken1}{" "}
          {position.pool.token1.symbol}
        </li>
        <li>
          <strong>Claimed Fees (in USD):</strong>{" "}
          {position.feesInfo?.totalClaimedFeesUSD}{" "}
        </li>
        {position.feesInfo?.unclaimedFees0 >= 0 && (
          <li>
            <strong>Total earned Fees (in USD):</strong>{" "}
            {position.feesInfo?.totalEarnedFeesUSD}{" "}
          </li>
        )}
      </p>
      <p>
        <strong>Creation Date:</strong>{" "}
        {new Date(position.createdAtTimestamp * 1000).toLocaleString()}
      </p>
      <p>
        <strong>Withdrawal:</strong>{" "}
        <li>
          <strong>Token Withdrawal:</strong>{" "}
          {position.withdrawalInfo.withdrawnToken0}{" "}
          {position.pool.token0.symbol} +{" "}
          {position.withdrawalInfo.withdrawnToken1}{" "}
          {position.pool.token1.symbol}
        </li>
        <li>
          <strong>Current Price (in USD):</strong>{" "}
          {position.currentPositionInfo.price0} {position.pool.token0.symbol}
          /USD + {position.currentPositionInfo.price1}{" "}
          {position.pool.token1.symbol}
          /USD
        </li>
        <li>
          <strong>Token Withdrawal in USD:</strong>{" "}
          {position.withdrawalInfo.withdrawnToken0USD}{" "}
          {position.pool.token0.symbol} +{" "}
          {position.withdrawalInfo.withdrawnToken1USD}{" "}
          {position.pool.token1.symbol}
        </li>
        <li>
          <strong>Total Amount Withdrawn (in USD):</strong>{" "}
          {position.withdrawalInfo.totalWithdrawnUSD} USD
        </li>
      </p>
      <p>
        <strong>Position Age(In Days):</strong>
        {position.aprApy?.positionAgeInDays}
      </p>
      {position.feesInfo?.unclaimedFees0 >= 0 && (
        <>
          <p>
            <strong>Total PNL:</strong> {position.totalPnlInUSD.toFixed(2)} USD
            <br />
            (Current USD Value + Amount Withdrawn USD + Total Fees Earned USD -
            Initial Value USD)
            <br />
            (${position.currentPositionInfo.currentPositionUSD || 0} + $
            {position.withdrawalInfo.totalWithdrawnUSD} + $
            {position.feesInfo?.totalEarnedFeesUSD} - $
            {position.amountDepositedUSD})
          </p>

          <p>
            <strong>APR/APY:</strong>
            <li>
              <strong>APR:</strong> {position.aprApy?.apr?.toFixed(2)}%
              <br />
              <p>
                Fee APR Logic:
                <br />
                1. (Total Fees / Initial Deposit) = Return rate for the entire
                period <br />
                2. We annualize it by dividing by the number of days and
                multiplying by 365.
                <br />
                APR = (totalFeesUSD / initialDepositUSD) * (365 /
                positionAgeInDays) * 100;
              </p>
            </li>
            <li>
              <strong>APY:</strong> {position.aprApy?.apy?.toFixed(2)}%{" "}
              <p>
                Fee APY Logic:
                <br />
                1. First, find the effective daily rate of return
                <br />
                DailyRate = totalFeesUSD / initialDepositUSD /
                positionAgeInDays;
                <br />
                2. Then, compound that daily rate over 365 days
                <br />
                APY = (Math.pow(1 + dailyRate, 365) - 1) * 100;
              </p>
            </li>
          </p>
        </>
      )}
      {/* <p>
        <strong>Initial Deposit:</strong> $
        {position.initialDepositUSD.toFixed(2)}
      </p>
      <p>
        <strong>Current Value:</strong> $
        {position.currentPositionUSD.toFixed(2)}
      </p> */}
      {/* Add other details like APR/APY and status */}
    </div>
  </div>
);

export default PositionCard;
