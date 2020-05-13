import React from "react";
import { Route, Switch } from "react-router-dom";
import About from "./About";
import Home from "./Home";
import NotFound from "./NotFound";
import Login from "./Login";
import Game from "./Game";

export default function Routes() {
  return (
    <Switch>
      <Route exact path="/about">
        <About />
      </Route>
      <Route exact path="/login">
        <div className="login-container">
          <Login />
        </div>
      </Route>
      <Route exact path="/">
        <Home />
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
