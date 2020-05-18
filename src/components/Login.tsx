import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import * as config from "../utils/client_config";
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";
import { Redirect } from "react-router";
import pp_logo from "../public/pparlour-logo.png";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/index";
import { signinIdp } from "../store/actions";
import { User, IDP } from "../store/types";
import "./App.scss";


const Login: React.FC = () => {

  const isSignedIn = useSelector((state: RootState) => state.isSignedIn);
  if (isSignedIn) {
    return (<Redirect to="/" />);
  }
  const dispatch = useDispatch();

  const responseSuccessGoogle = (response: GoogleLoginResponse) => {
    const whoami = response.getBasicProfile();
    console.log(`${JSON.stringify(response)} hi ${whoami.getEmail()}`);
    let newUser: User = {
      id: whoami.getId(),
      idp: IDP.GOOGLE,
      name: whoami.getName(),
      email: whoami.getEmail(),
      isSignedIn: true
    };
    dispatch(signinIdp(newUser));
  };

  const failedGoogle = (error: any) => {
    console.log(`failGoogle: ${JSON.stringify(error)}`);
  };

  //   useEffect(() => {
  //     window.gapi.load("auth2", () => {
  //       gAuth2: gapi.auth2.GoogleAuth = gapi.auth2.init({
  //         client_id: config.googleConfig.clientId,
  // 	  });
  //     });
  //   });

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col className="text-center" md={3}>
          <h3>Sign In</h3>
          <img src={pp_logo} className="App-logo" alt="logo" />
          <p>You are not signed in. Click below to sign in using google.</p>
          <GoogleLogin
            clientId={config.googleConfig.clientId}
            // buttonText="Login with Google"
            onSuccess={responseSuccessGoogle}
            onFailure={failedGoogle}
            isSignedIn={isSignedIn}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
