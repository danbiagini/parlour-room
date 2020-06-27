import * as React from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { NavBarUI } from "./NavBarUI";
import { AppFooter } from "./Footer";
import { store } from "../store/index";
import Routes from "./Routes";

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
  return (
    <Grommet theme={theme} themeMode="light">
      <Box fill flex>
        <BrowserRouter>
          <Provider store={store}>
            <NavBarUI />
            <Routes />
            <AppFooter />
          </Provider>
        </BrowserRouter>
      </Box>
    </Grommet>
  );
};

export default App;
