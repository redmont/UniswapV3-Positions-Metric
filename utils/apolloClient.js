// utils/apolloClient.js

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const graphClient = new ApolloClient({
  link: new HttpLink({
    //uri: `https://gateway.thegraph.com/api/subgraphs/id/9fWsevEC9Yz4WdW9QyUvu2JXsxyXAxc1X4HaEkmyyc75`,
    uri: `https://gateway-arbitrum.network.thegraph.com/api/${process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY}/subgraphs/id/9fWsevEC9Yz4WdW9QyUvu2JXsxyXAxc1X4HaEkmyyc75`,
  }),
  cache: new InMemoryCache(),
});

export default graphClient;
