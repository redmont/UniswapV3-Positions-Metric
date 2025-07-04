// utils/apolloClient.js

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

export const graphClient1 = new ApolloClient({
  link: new HttpLink({
    uri: `https://gateway-arbitrum.network.thegraph.com/api/${process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY}/subgraphs/id/9fWsevEC9Yz4WdW9QyUvu2JXsxyXAxc1X4HaEkmyyc75`,
  }),
  cache: new InMemoryCache(),
});
export const graphClient2 = new ApolloClient({
  link: new HttpLink({
    uri: `https://gateway-arbitrum.network.thegraph.com/api/${process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`,
  }),
  cache: new InMemoryCache(),
});

export const mergePositionData = (positions1, positions2) => {
  // Use a Map for efficient lookup by position ID.
  const positionsMap = new Map();

  // 1. Add all positions from the first list to the map.
  for (const position of positions1) {
    positionsMap.set(position.id, position);
  }

  // 2. Loop through the second list to merge and add positions.
  for (const position of positions2) {
    // Check if this position already exists from the first list.
    const existingPosition = positionsMap.get(position.id);

    if (existingPosition) {
      // If it exists, merge them. The spread operator `...` ensures that
      // properties from the second position (the richer one) overwrite the first.
      positionsMap.set(position.id, { ...existingPosition, ...position });
    } else {
      // If it's a new position only found in the second list, just add it.
      positionsMap.set(position.id, position);
    }
  }

  // 3. Convert the map back to an array for the final result.
  return Array.from(positionsMap.values());
};
