import React from "react";
import { Route, Switch } from "react-router-dom";
import About from "./About";
import Home from "./Home";
import NotFound from "./NotFound";
import { Login } from "./Login";
import Game from "./Game";
import Privacy from "./Privacy";
import { SignUp } from "./SignUp";

export default function Routes() {
  return (
    <Switch>
      <Route exact path="/about">
        <About />
      </Route>
      <Route exact path="/login">
        <Login />
      </Route>
      <Route exact path="/signup">
        <SignUp />
      </Route>
      <Route exact path="/">
        <Home />
      </Route>
      <Route exact path="/privacy">
        <Privacy />
      </Route>
      <Route exact path="/oldmaid">
        <Game />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}
