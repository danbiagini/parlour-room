import React from "react";
import {
  Container,
  Row,
  Col,
  FormControl,
  Jumbotron,
  Card,
} from "react-bootstrap";

import GoogleLogin, { GoogleLoginResponse } from "react-google-login";
import { Redirect } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import axios, { AxiosError } from "axios";

import pp_logo from "../public/pparlour-logo.png";
import * as config from "../common/client_config";
import { RootState } from "../store/index";
import { signinIdp, signoutIdp } from "../store/actions";
import { User, IDP, ApiError, ApiResponse, isApiError } from "../common/types";

import "./App.scss";

export const SignUp: React.FC = () => {
  const isSignedIn = useSelector((state: RootState) => state.isSignedIn);
  // if (isSignedIn) {
  //   return <Redirect to="/" />;
  // }
  const dispatch = useDispatch();

  // const failedGoogle = (error: any) => {
  //   console.log(`failGoogle: ${JSON.stringify(error)}`);
  //   dispatch(signoutIdp());
  // };

  // GoogleLogin default scope is 'profile email'.
  return (
    <Container>
      <Card border="primary">
        <Card.Header as="h4">Sign Up</Card.Header>
        <Card.Body>
          <Card.Text>
            Create an account in Pandemic Parlour. Choose a username and click
            below to sign up using google.
          </Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
};
