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
  const positionsMap = new Map();

  for (const position of positions1) {
    positionsMap.set(position.id, position);
  }

  for (const position of positions2) {
    const existingPosition = positionsMap.get(position.id);

    if (existingPosition) {
      positionsMap.set(position.id, { ...existingPosition, ...position });
    } else {
      positionsMap.set(position.id, position);
    }
  }

  return Array.from(positionsMap.values());
};
