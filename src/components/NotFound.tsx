import React from "react";
import { Heading, Main } from "grommet";
import { Bug } from "grommet-icons";

const silly = [
  "Well this is embarassing!",
  "It's not you, it's me",
  "Oops",
  "Pay no attention to that man behind the curtain",
];

export default function NotFound() {
  return (
    <Main justify="center" align="center" flex="shrink">
      <Heading level={3}>
        {silly[Math.floor(Math.random() * silly.length)]}
      </Heading>
      <Bug size="large" color="brand" />
    </Main>
  );
}
