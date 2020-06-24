import React from "react";
import pp_logo from "../public/pparlour-logo.png";
import { Box, Header, Heading, Image, Nav } from "grommet";
// import { Notification } from "grommet-icons";
import { useSelector } from "react-redux";
import { RootState } from "../store/index";
import RoutedButton from "./RoutedButton";

export const NavBarUI: React.FC = () => {
  const isSignedIn = useSelector((state: RootState) => {
    return state.isSignedIn;
  });

  let identityElements = (
    <React.Fragment>
      <RoutedButton path="/account" label="Account" />
      <RoutedButton path="/logout" label="Logout" />
    </React.Fragment>
  );

  if (!isSignedIn) {
    identityElements = (
      <React.Fragment>
        <RoutedButton path="/signup" label="Sign Up" />
        <RoutedButton path="/login" label="Login" />
      </React.Fragment>
    );
  }

  return (
    <Header
      height="120px"
      background="brand"
      pad="xsmall"
      gap="small"
      elevation="none"
      style={{ position: "relative" }}
    >
      <RoutedButton hoverIndicator={true} path="/">
        <Box
          flex={false}
          direction="row"
          align="center"
          margin={{ left: "small" }}
        >
          <Image
            height="110px"
            src={pp_logo}
            margin={{
              left: "small",
              right: "small",
              top: "xsmall",
              bottom: "xsmall",
            }}
          />
          <Heading level="3">Pandemic Parlour</Heading>
        </Box>
      </RoutedButton>
      <Nav direction="row" pad="medium" background="brand">
        {identityElements}
      </Nav>
    </Header>
  );
};
