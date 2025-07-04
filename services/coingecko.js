import axios from "axios";

const options = {
  headers: {
    "Content-Type": "application/json",
    // This API key is now safe on the server
    "x-cg-demo-api-key": process.env.COINGECKO_API_KEY || "",
  },
};

// Caches for prices and the main coin list
const priceCache = new Map();
const historicalPriceCache = new Map();
const coinListCache = new Map();

// This function now uses a server-side cache instead of localStorage
export const getCoinsList = async () => {
  const cacheKey = "coinListData";
  const CACHE_DURATION = 60 * 60 * 253000; // 1 hour
  const cachedItem = coinListCache.get(cacheKey);

  if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
    console.log("Returning coin list from server cache.", cachedItem.data);
    return cachedItem.data;
  }

  try {
    console.log("Fetching new coin list from API.");
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/list?include_platform=true`,
      options
    );

    coinListCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching coin list:`, error);
    return null;
  }
};

export const getPriceAtTimestamp = async (tokenAddress1, date) => {
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  try {
    const allCoins = await getCoinsList();
    const coinId1 = findCoinIdByEthereumAddress(allCoins, tokenAddress1);
    if (!coinId1)
      throw new Error(`Could not find coinId for address: ${tokenAddress1}`);

    const cacheKey = `${coinId1}-${date}`;
    const cachedItem = historicalPriceCache.get(cacheKey);

    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
      console.log(`Returning cached historical price for: ${cacheKey}`);
      return cachedItem.price;
    }

    // ... (rest of the function is the same, just using the new getCoinsList)
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId1}/history?date=${date}&localization=false`,
      options
    );
    const price = response.data?.market_data?.current_price?.usd;
    if (price === undefined)
      throw new Error(`Historical price not found for key: ${cacheKey}`);

    historicalPriceCache.set(cacheKey, { price, timestamp: Date.now() });
    return price;
  } catch (error) {
    console.error(
      `Error fetching price for ${tokenAddress1} on ${date}:`,
      error
    );
    return 0;
  }
};

export const getCurrentPrice = async (tokenAddress1, tokenAddress2) => {
  // ... (this function can remain the same, as it will call the new getCoinsList)
  // ... it will now use the server-side cache automatically.
  const CACHE_DURATION = 5 * 60 * 1000;
  try {
    const allCoins = await getCoinsList();
    let coinId1 = findCoinIdByEthereumAddress(allCoins, tokenAddress1);
    let coinId2 = tokenAddress2
      ? findCoinIdByEthereumAddress(allCoins, tokenAddress2)
      : "usd";
    if (!coinId1)
      throw new Error(`Could not find coinId for address: ${tokenAddress1}`);
    if (typeof coinId2 === "string" && coinId2.startsWith("w"))
      coinId2 = coinId2.substring(1);

    const cacheKey = `${coinId1}-${coinId2}`;
    const cachedItem = priceCache.get(cacheKey);

    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
      console.log(`Returning cached price for: ${cacheKey}`);
      return cachedItem.price;
    }

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?vs_currencies=${coinId2}&contract_addresses=${tokenAddress1}`,
      options
    );
    const price = response.data[tokenAddress1]?.[coinId2];
    if (price === undefined)
      throw new Error(`Price not found for key: ${cacheKey}`);

    priceCache.set(cacheKey, { price, timestamp: Date.now() });
    return price;
  } catch (error) {
    console.error(
      `Error fetching current price for ${tokenAddress1}, ${tokenAddress2}:`,
      error
    );
    return 0;
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
