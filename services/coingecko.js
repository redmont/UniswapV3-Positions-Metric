// services/coingecko.js

import axios from "axios";

const options = {
  headers: {
    "Content-Type": "application/json",
    "x-cg-demo-api-key": process.env.COINGECKO_API_KEY || "",
  },
};

// 1. Create a cache object outside the function. A Map is great for this.
const priceCache = new Map();
const historicalPriceCache = new Map();

export const getPriceAtTimestamp = async (tokenAddress1, date) => {
  // 2. Set a long cache duration (e.g., 24 hours in milliseconds)
  const CACHE_DURATION = 24 * 60 * 60 * 1000;

  try {
    const allCoins = await getCoinsListFromLocalStorage();
    const coinId1 = findCoinIdByEthereumAddress(allCoins, tokenAddress1);

    if (!coinId1) {
      throw new Error(`Could not find coinId for address: ${tokenAddress1}`);
    }

    // 3. Create a unique key from the coin ID and the specific date
    const cacheKey = `${coinId1}-${date}`;
    const cachedItem = historicalPriceCache.get(cacheKey);

    // 4. Check if a valid, non-expired item exists in the cache
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
      console.log(`Returning cached historical price for: ${cacheKey}`);
      return cachedItem.price;
    }

    // 5. If not in cache, fetch from the API
    console.log(`Fetching new historical price for: ${cacheKey}`);
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId1}/history?date=${date}&localization=false`,
      options
    );

    const price = response.data?.market_data?.current_price?.usd;

    if (price === undefined) {
      throw new Error(
        `Historical price not found in CoinGecko response for key: ${cacheKey}`
      );
    }

    // 6. Store the new result and timestamp in the cache
    historicalPriceCache.set(cacheKey, {
      price: price,
      timestamp: Date.now(),
    });

    return price;
  } catch (error) {
    console.error(
      `Error fetching price for ${tokenAddress1} on ${date}:`,
      error
    );
    return 0; // Return 0 on failure
  }
};

export const getCurrentPrice = async (tokenAddress1, tokenAddress2) => {
  // 2. Define the cache duration (2 minutes in milliseconds)
  const CACHE_DURATION = 5 * 60 * 1000;

  try {
    const allCoins = await getCoinsListFromLocalStorage();
    let coinId1 = findCoinIdByEthereumAddress(allCoins, tokenAddress1);
    let coinId2 = tokenAddress2
      ? findCoinIdByEthereumAddress(allCoins, tokenAddress2)
      : "usd";

    // Basic validation to ensure we can proceed
    if (!coinId1) {
      throw new Error(`Could not find coinId for address: ${tokenAddress1}`);
    }

    // This logic seems specific to your use case, keeping it as is
    if (typeof coinId2 === "string" && coinId2.startsWith("w")) {
      coinId2 = coinId2.substring(1);
    }

    // 3. Create a unique key for the cache from the dynamic IDs
    const cacheKey = `${coinId1}-${coinId2}`;
    const cachedItem = priceCache.get(cacheKey);

    // 4. Check if a valid, non-expired item exists in the cache
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
      console.log(`Returning cached price for: ${cacheKey}`);
      return cachedItem.price;
    }

    // 5. If not in cache or expired, fetch from the API
    console.log(`Fetching new price for: ${cacheKey}`);
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?vs_currencies=${coinId2}&contract_addresses=${tokenAddress1}`,
      options
    );

    const price = response.data[tokenAddress1]?.[coinId2];

    if (price === undefined) {
      throw new Error(
        `Price not found in CoinGecko response for key: ${cacheKey}`
      );
    }

    // 6. Store the new result and timestamp in the cache
    priceCache.set(cacheKey, {
      price: price,
      timestamp: Date.now(),
    });

    return price;
  } catch (error) {
    console.error(
      `Error fetching current price for ${tokenAddress1}, ${tokenAddress2}:`,
      error
    );
    return 0; // Return 0 on failure
  }
};

export const getCoinsListFromLocalStorage = async () => {
  const cacheKey = "coinListData";
  const cacheDuration = 60 * 60 * 1000; // 1 hour

  // 1. Try to get data from localStorage
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    const now = Date.now();

    // 2. Check if the cached data is still valid
    if (now - timestamp < cacheDuration) {
      console.log("Returning data from localStorage cache.");
      return data;
    }
  }

  // 3. If no valid cache, fetch from API
  try {
    console.log("Fetching new data for localStorage.");
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/list?include_platform=true`
    );

    const dataToCache = {
      data: response.data,
      timestamp: Date.now(),
    };

    // 4. Store the new data and timestamp in localStorage
    localStorage.setItem(cacheKey, JSON.stringify(dataToCache));

    return response.data;
  } catch (error) {
    console.error(`Error fetching coin list:`, error);
    return null;
  }
};

export const findCoinIdByEthereumAddress = (coinsList, contractAddress) => {
  // Ensure the input is valid
  if (!coinsList || !contractAddress) {
    return null;
  }

  // Normalize the address to lowercase for a case-insensitive comparison
  const targetAddress = contractAddress.toLowerCase();

  // Use the .find() method to search the array
  const foundCoin = coinsList.find(
    (coin) =>
      coin.platforms &&
      coin.platforms.ethereum &&
      coin.platforms.ethereum.toLowerCase() === targetAddress
  );

  // Return the coin's id if found, otherwise return null
  return foundCoin ? foundCoin.id : null;
};
