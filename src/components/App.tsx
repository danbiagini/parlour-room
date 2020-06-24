import * as React from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { NavBarUI } from "./NavBarUI";
import { AppFooter } from "./Footer";
import { store } from "../store/index";
import Routes from "./Routes";

import { Box, Grommet } from "grommet";

const theme = {
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
};

const App: React.FC = () => {
  return (
    <Grommet theme={theme} themeMode="dark">
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
