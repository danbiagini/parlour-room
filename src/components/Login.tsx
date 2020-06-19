import React, { useState } from "react";
import { Container, Row, Col, Modal, Button } from "react-bootstrap";
import {
  GoogleLogin,
  GoogleLogout,
  GoogleLoginResponse,
} from "react-google-login";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";

import pp_logo from "../public/pparlour-logo.png";
import * as config from "../common/client_config";
import { RootState } from "../store/index";
import { signinIdp, signoutIdp } from "../store/actions";
import { User, IDP, ApiResponse } from "../common/types";

import "./App.scss";
import { useHistory } from "react-router-dom";

const apiClient = axios.create({
  responseType: "json",
  headers: {
    "Content-Type": "application/json",
  },
});

export const serverAuth = async (user: User, id_token: string) => {
  console.log("starting server authentication");
  const axRes = await apiClient.get<User>("/api/auth/google.com/login", {
    params: { code: id_token },
    validateStatus: (status) => {
      return status < 500;
    },
  });
  const response: ApiResponse = {
    data: axRes.data,
    code: axRes.status,
  };
  return response;
};

export const Login: React.FC = () => {
  const isSignedIn = useSelector((state: RootState) => state.isSignedIn);
  const idpId = useSelector((state: RootState) => state.idpId);
  const email = useSelector((state: RootState) => state.email);
  const [showSignup, setShowSignup] = useState(true);
  const history = useHistory();
  const dispatch = useDispatch();

  const responseSuccessGoogle = (response: GoogleLoginResponse) => {
    // const whoami = response.getBasicProfile();
    const id = response.googleId;
    const id_token = response.tokenId;
    const email = response.profileObj.email;
    const name = response.profileObj.givenName;
    const last = response.profileObj.familyName;
    console.log(
      `${JSON.stringify(response)} hi ${email}, with token ${id_token}`
    );

    let newUser: User = {
      idpId: id,
      idp: IDP.GOOGLE,
      firstName: name,
      email: email,
      profPicUrl: response.profileObj.imageUrl,
      isSignedIn: false,
      lastName: last,
    };

    serverAuth(newUser, id_token)
      .then((response) => {
        if (response.code === 200) {
          console.log(`Success, logged in ${response.data.idpId}`);
        } else if (response.code === 403) {
          console.log("403, user doesn't exist.");
        } else {
          console.log(
            `login failed, code: ${response.code}, message ${response.data}`
          );
          newUser.idpId = undefined;
          newUser.isSignedIn = false;
          newUser.firstName = undefined;
          newUser.email = undefined;
          newUser.profPicUrl = undefined;
          newUser.lastName = undefined;
        }
        // setup the user in store
        dispatch(signinIdp(newUser));
      })
      .catch((error) => {
        console.log(`Error: ${error}`);
        dispatch(signoutIdp());
      });
  };

  const failedGoogle = (error: any) => {
    console.log(`failGoogle: ${JSON.stringify(error)}`);
    dispatch(signoutIdp());
  };

  const logoutGoogle = () => {
    console.log(`logged out: ${idpId}`);
    setShowSignup(true);
    dispatch(signoutIdp());
  };

  const handleNoShow = () => setShowSignup(false);
  const goToSignup = () => history.push("/signup");
  let alert = undefined;
  if (!isSignedIn && idpId && showSignup) {
    alert = (
      <Modal.Dialog>
        <Modal.Header closeButton onHide={handleNoShow}>
          <Modal.Title>Parlour Account Not Found</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          No Parlour account found for Google account <b>{email}</b>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={goToSignup}>
            Sign up with this google account
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    );
  }

  // GoogleLogin default scope is 'profile email'.
  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col className="text-center" md={3}>
          <img src={pp_logo} className="App-logo" alt="logo" />
          {alert ? alert : <div />}
          {isSignedIn || idpId ? (
            <div>
              <h3>Sign Out</h3>
              <GoogleLogout
                clientId={config.googleConfig.clientId}
                onLogoutSuccess={logoutGoogle}
                buttonText="Logout"
              />
            </div>
          ) : (
            <div>
              <h3>Sign In</h3>
              <p>You are not signed in. Click below to sign in using Google.</p>
              <GoogleLogin
                responseType="id_token"
                clientId={config.googleConfig.clientId}
                onSuccess={responseSuccessGoogle}
                onFailure={failedGoogle}
                buttonText="Sign in with Google"
                cookiePolicy={"single_host_origin"}
                isSignedIn
              />
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};
