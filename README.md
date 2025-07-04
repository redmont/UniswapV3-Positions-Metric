<h1>Uniswap V3 Positions Analytics</h1>

Provides complete details about all the Uniswap V3 positions of a wallet Address.

It fetches necessary data from two subgraphs and calculates all the metrics using Uniswap v3 formulas.

Deployed on: https://uniswapv3-positions-metric.onrender.com/

<h3>Sample Response</h3>

```
Position ID: 1003941 (Inactive, Out of Range)
Tokens: RNDR / WETH
Contract Address: 0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24 / 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2

Fee Tier: 0.3%

Position Price Range: 0.0013365426354679882 - 0.0016291790824971438

Current Price ($RNDR/$WETH): 0.001243510274082906061842854890128736

Position Status: Out of Range

Initial:
Amount: 176.42528098228946325 RNDR + 0.225968852223704311 WETH
Prices of Assets at Deposit: 3.5726297870140398 RNDR/USD , 2421.1279088974475 WETH/USD
Value of Assets at Deposit (in USD): 630.3022140196489 RNDR + 547.0994946603336 WETH
Total (in USD): 1177.4017086799824

Current:
Amount: 0 RNDR + 0 WETH
Price (in USD): RNDR/USD + WETH/USD
Total (in USD): 0

Fees:
Unclaimed Fees: 0 RNDR + 0 WETH
Unclaimed Fees (in USD): 0
Claimed Fees: 9.439419481462437 RNDR + 0.01282922042380595 WETH
Claimed Fees (in USD): 61.12998392526753
Total earned Fees (in USD): 61.12998392526753

Creation Date: 06/06/2025, 07:00:35

Withdrawal:
Token Withdrawal: 337.880343384979534416 RNDR + 0 WETH
Current Price (in USD): RNDR/USD + WETH/USD
Token Withdrawal in USD: 1047.4290644934365 RNDR + 0 WETH
Total Amount Withdrawn (in USD): 1047.4290644934365 USD

Position Age(In Days):28.628284641203503

Total PNL: -59.45 USD
(Current USD Value + Amount Withdrawn USD + Total Fees Earned USD - Initial Value USD)
($0 + $1047.4290644934365 + $61.12998392526753 - $1168.005938257267588410378512320902)

APR/APY:
APR: 66.20%
Fee APR Logic:
1. (Total Fees / Initial Deposit) = Return rate for the entire period
2. We annualize it by dividing by the number of days and multiplying by 365.
APR = (totalFeesUSD / initialDepositUSD) * (365 / positionAgeInDays) * 100;

APY: 93.74%
Fee APY Logic:
1. First, find the effective daily rate of return
DailyRate = totalFeesUSD / initialDepositUSD / positionAgeInDays;
2. Then, compound that daily rate over 365 days
APY = (Math.pow(1 + dailyRate, 365) - 1) * 100;
```

<h2>Running Locally & Testing</h2>

```
npm install
npx run dev
```
