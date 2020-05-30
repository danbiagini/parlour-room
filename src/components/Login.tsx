import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";
import { Redirect } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import axios, { AxiosError } from "axios";

import pp_logo from "../public/pparlour-logo.png";
import * as config from "../utils/client_config";
import { RootState } from "../store/index";
import { signinIdp, signoutIdp } from "../store/actions";
import { User, IDP, ApiError, ApiResponse, isApiError } from "../store/types";

import "./App.scss";

const apiClient = axios.create({
  responseType: "json",
  headers: {
    "Content-Type": "application/json"
  }
});

export const serverAuth = async (user: User, id_token: string) => {

  try {
    const axRes = await apiClient.post<User>("/auth/token", {
      user: user,
      token: id_token
    });
    const response: ApiResponse = {
      data: axRes.data,
      code: axRes.status
    };

    return (response);
  } catch (error) {
    console.log(`error: ${error}`);
    if (error && error.response) {
      const axiosErr = error as AxiosError<ApiError>;
      return (axiosErr.response.data);
    }
    throw error;
  }
};

export const Login: React.FC = () => {

  const isSignedIn = useSelector((state: RootState) => state.isSignedIn);
  if (isSignedIn) {
    return (<Redirect to="/" />);
  }
  const dispatch = useDispatch();

  const responseSuccessGoogle = (response: GoogleLoginResponse) => {
    // const whoami = response.getBasicProfile();
    const id = response.googleId;
    const id_token = response.tokenId;
    const email = response.profileObj.email;
    const name = response.profileObj.givenName;
    const last = response.profileObj.familyName;
    console.log(`${JSON.stringify(response)} hi ${email}, with token ${id_token}`);

    let newUser: User = {
      idpId: id,
      idp: IDP.GOOGLE,
      firstName: name,
      email: email,
      profPicUrl: response.profileObj.imageUrl,
      isSignedIn: true,
      lastName: last
    };

    serverAuth(newUser, id_token)
      .then((response) => {
        if (!isApiError(response)) {
          console.log(`Success, logged in ${response.data.idpId}`);
        } else {
          console.log(`Api error: ${response.code} ${response.description}`);
        }
      }).catch((error) => {
        console.log(`Error logging in: ${error}`);
      });
    
    dispatch(signinIdp(newUser));
  };

  const failedGoogle = (error: any) => {
    console.log(`failGoogle: ${JSON.stringify(error)}`);
    dispatch(signoutIdp());
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col className="text-center" md={3}>
          <h3>Sign In</h3>
          <img src={pp_logo} className="App-logo" alt="logo" />
          <p>You are not signed in. Click below to sign in using google.</p>
          <GoogleLogin
            responseType="id_token token"
            clientId={config.googleConfig.clientId}
            onSuccess={responseSuccessGoogle}
            onFailure={failedGoogle}
            isSignedIn={isSignedIn}
          />
        </Col>
      </Row>
    </Container>
  );
};
