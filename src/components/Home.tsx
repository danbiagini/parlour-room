import * as React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/index";
import { Redirect } from "react-router";
import { Box, Heading, Paragraph } from "grommet";
import { useMyParloursAndInvitesQuery } from "../generated/graphql";
import { ParlourCarousel } from "./ParlourCarousel";

const Home: React.FC = () => {
  const isSignedIn = useSelector((state: RootState) => state.user.isSignedIn);
  const whoami = useSelector((state: RootState) => state.user.firstName);
  const result = useMyParloursAndInvitesQuery({});

  if (!isSignedIn) {
    return <Redirect to="/about" />;
  }

  if (result.loading) {
    return <h1>Loading...</h1>;
  }

  if (result.error) {
    return <h1>Error... {result.error.message}</h1>;
  }

  return (
    <Box
      fill="vertical"
      justify="center"
      margin="medium"
      align="center"
      overflow="scroll"
    >
      <Heading level="3">{`Welcome ${whoami}!`}</Heading>
      <Paragraph>Select a Parlour below to visit...</Paragraph>
      <ParlourCarousel parlours={result.data} />
    </Box>
  );
};

export default Home;
