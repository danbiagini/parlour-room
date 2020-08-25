import React from "react";
import { Heading, Main } from "grommet";
import { Halt } from "grommet-icons";

export default function NoInvite() {
  return (
    <Main justify="center" align="center" flex="shrink">
      <Halt size="large" color="brand" />
      <Heading level={3}>Sorry, invitation only...</Heading>
      <Heading level={4} textAlign="center">
        {"We're in beta, signups are currently limited!"}
      </Heading>
    </Main>
  );
}
