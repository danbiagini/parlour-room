import React from "react";
import pp_logo from "../public/pparlour-logo.png";
import { Box, Header, Heading, Image, Nav } from "grommet";
// import { Notification } from "grommet-icons";
import { useSelector } from "react-redux";
import { RootState } from "../store/index";
import RoutedButton from "./RoutedButton";

export const NavBarUI: React.FC = () => {
  const isSignedIn = useSelector((state: RootState) => {
    return state.user.isSignedIn;
  });

  let identityElements = [
    <RoutedButton key="account" path="/account" label="Account" />,
    <RoutedButton key="logout" path="/logout" label="Logout" />,
  ];

  if (!isSignedIn) {
    identityElements = [
      <RoutedButton key="signup" path="/signup" label="Sign Up" />,
      <RoutedButton key="login" path="/login" label="Login" />,
    ];
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
      <Nav direction="row" gap="small" pad="medium" background="brand">
        {identityElements.map((v) => v)}
      </Nav>
    </Header>
  );
};
