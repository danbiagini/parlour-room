import * as React from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { NavBarUI } from "./NavBarUI";
import { Footer } from "./Footer";
import { store } from "../store/index";
import Routes from "./Routes";
import GoogleLoginResponse from "react-google-login";

interface IState {
  isSignedIn: boolean;
  user: GoogleLoginResponse;
}



export default class App extends React.Component<{}, IState> {
  public readonly state: Readonly<IState> = {
    isSignedIn: false,
    user: null
  };

  signIn = (user: GoogleLoginResponse) => {
    console.log("app got a login");
    this.setState({
      isSignedIn: true,
      user: user
    });
  };

  public render() {
    return (
      <div className="App container">
        <BrowserRouter>
          <Provider store={store}>
            <NavBarUI />
            <Routes />
            <Footer />
          </Provider>
        </BrowserRouter>
      </div>
    );
  }
}
