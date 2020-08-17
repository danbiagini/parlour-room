import * as React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/index";
import { Redirect } from "react-router";
import pp from "../public/pparlour-logo.png";
import { Box } from "grommet";

const Home: React.FC = () => {
  const isSignedIn = useSelector((state: RootState) => state.user.isSignedIn);
  const whoami = useSelector((state: RootState) => state.user.firstName);

  if (!isSignedIn) {
    return <Redirect to="/about" />;
  }

  let content = <h1>{`Hello ${whoami}, you're signed in`}</h1>;

  return (
    <Box
      fill="vertical"
      justify="center"
      margin="medium"
      align="center"
      overflow="scroll"
    >
      <header className="App-header">
        <img src={pp} className="App-logo" alt="logo" />
      </header>
      <div>{content}</div>
    </Box>
  );
};

export default Home;
