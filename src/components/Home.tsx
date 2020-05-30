import * as React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/index";
import { Redirect } from "react-router";
import pp from "../public/pparlour-logo.png";

const Home: React.FC = () => {
  const isSignedIn = useSelector((state: RootState) => state.isSignedIn);

  if (!isSignedIn) {
    return (<Redirect to="/about"/>);
  }

  const whoami = useSelector((state: RootState) => state.firstName);
  let content = <h1>{`Hello ${whoami}, you're signed in`}</h1>;


  return (
    <div className="Home">
      <header className="App-header">
        <img src={pp} className="App-logo" alt="logo" />
      </header>
      <div>{content}</div>
    </div>
  );
};

export default Home;