import * as React from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { NavBarUI } from "./NavBarUI";
import { AppFooter } from "./Footer";
import { store } from "../store/index";
import Routes from "./Routes";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import { Box, Grommet, grommet } from "grommet";
import { deepMerge } from "grommet/utils";

const theme = deepMerge(grommet, {
  global: {
    font: {
      family: "Roboto",
      size: "18px",
      height: "20px",
    },
    colors: {
      brand: "#228BE6",
    },
  },
  formField: {
    border: {
      color: "border",
      position: "outer",
      side: "all",
    },
  },
});

const App: React.FC = () => {
  const client = new ApolloClient({
    uri: "/graphql",
    cache: new InMemoryCache(),
  });
  return (
    <Grommet theme={theme} themeMode="light">
      <Box fill flex>
        <BrowserRouter>
          <ApolloProvider client={client}>
            <Provider store={store}>
              <NavBarUI />
              <Routes />
              <AppFooter />
            </Provider>
          </ApolloProvider>
        </BrowserRouter>
      </Box>
    </Grommet>
  );
};

export default App;
