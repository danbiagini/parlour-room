import React from "react";
import { Box, Footer, Image, Text } from "grommet";
import pp_logo from "../public/pparlour-logo.png";
import RoutedAnchor from "./RoutedAnchor";

export const AppFooter: React.FC = () => {
  return (
    <Footer
      background="brand"
      pad={{ horizontal: "large", vertical: "xsmall" }}
    >
      <Box direction="row" gap="medium">
        <RoutedAnchor href="/">
          <Box gap="small" direction="row" height="76px">
            <Image src={pp_logo} fit="cover" fill="vertical" />
            <Text color="white" alignSelf="center">
              Home
            </Text>
          </Box>
        </RoutedAnchor>
        <Box align="center" gap="small" direction="row" height="76px">
          <RoutedAnchor href="/privacy">
            <Text color="white" alignSelf="center">
              Privacy
            </Text>
          </RoutedAnchor>
        </Box>
      </Box>
      <Text textAlign="center" size="small">
        &copy; 2020 Copyright Three Bees
      </Text>
    </Footer>
  );
};
