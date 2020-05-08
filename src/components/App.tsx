import * as React from "react";
// import ReactDOM from 'react-dom';
// import { Provider } from "react-redux";
import { UI } from "./UI";
// import store from "../store";
import Routes from "./Routes";

interface IState {
  isSignedIn: boolean;
}

export default class App extends React.Component<{}, IState> {
  public readonly state: Readonly<IState> = {
    isSignedIn: false,
  };

  signIn = () => {
    console.log("app got a login");
    this.setState({
      isSignedIn: true,
    });
  };

  public render() {
    return (
      <div className="App container">
        <UI isSignedIn={this.state.isSignedIn} />
        <Routes isSignedIn={this.state.isSignedIn} signInCb={this.signIn} />
      </div>
    );
  }
}
