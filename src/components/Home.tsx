import * as React from "react";
// import ReactDOM from 'react-dom';
// import { Provider } from "react-redux";
// import { UI } from './UI';
// import store from "../store";
// import Routes from './Routes';
import About from "./About";
import pp from "../public/pparlour-logo.png";

interface IProps {
  isSignedIn: boolean;
}

export default class Home extends React.Component<IProps, {}> {
  constructor(props: IProps) {
    super(props);
  }

  getContent() {
    if (this.props.isSignedIn) {
      return <p>{"hello user, you're signed in "}</p>;
    } else {
      return (
        <About />
      );
    }
  }

  render() {
    return (
      <div className="Home">
        <header className="App-header">
          <img src={pp} className="App-logo" alt="logo" />
        </header>
        <div>
          {this.getContent()}
        </div>
      </div>
    );
  }
}
