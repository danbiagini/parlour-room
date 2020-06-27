import React from "react";
import { Box, Button, Heading, Text, Layer } from "grommet";
import {
  GoogleLogin,
  GoogleLogout,
  GoogleLoginResponse,
  useGoogleLogout,
} from "react-google-login";
import { useSelector, useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";

import * as config from "../common/client_config";
import { RootState } from "../store/index";
import { signinIdp, signoutIdp } from "../store/actions";
import { User, IDP } from "../common/types";
import { serverAuth } from "./Auth";

export const Login: React.FC = () => {
  const isSignedIn = useSelector((state: RootState) => state.isSignedIn);
  const idpId = useSelector((state: RootState) => state.idpId);
  const email = useSelector((state: RootState) => state.email);
  const history = useHistory();
  const dispatch = useDispatch();

  const responseSuccessGoogle = (response: GoogleLoginResponse) => {
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

  const logoutGoogleSuccess = () => {
    console.log(`logged out: ${idpId}`);
    dispatch(signoutIdp());
  };

  const { signOut } = useGoogleLogout({
    clientId: config.googleConfig.clientId,
    onLogoutSuccess: logoutGoogleSuccess,
  });

  const handleNoShow = () => {
    signOut();
  };
  const goToSignup = () => history.push("/signup");
  let alert = undefined;
  if (!isSignedIn && idpId) {
    alert = (
      <Layer
        position="center"
        onClickOutside={handleNoShow}
        onEsc={handleNoShow}
      >
        <Box pad="medium" gap="small" width="medium">
          <Heading level={3}>Parlour Account Not Found</Heading>
          <Text>
            No Parlour account found for Google account <b>{email}</b>, would
            you like to sign up?
          </Text>
          <Box
            as="footer"
            gap="small"
            direction="row"
            align="center"
            justify="center"
          >
            <Button onClick={goToSignup} label="Sign up" primary />
            <Button onClick={handleNoShow} label="Cancel" />
          </Box>
        </Box>
      </Layer>
    );
  }

  // GoogleLogin default scope is 'profile email'.
  return (
    <Box fill="vertical" justify="center" align="center" flex="shrink">
      {alert ? alert : <div />}
      {isSignedIn || idpId ? (
        <Box alignContent="center" align="center">
          <Heading level={3}>Sign Out</Heading>
          <Box direction="row" pad="large" width="medium" justify="center">
            <GoogleLogout
              clientId={config.googleConfig.clientId}
              onLogoutSuccess={logoutGoogleSuccess}
              buttonText="Logout"
            />
          </Box>
        </Box>
      ) : (
        <Box alignContent="center" align="center">
          <Heading alignSelf="center" level={3}>
            Sign In
          </Heading>
          <Text>
            You are not signed in. Click below to sign in using Google.
          </Text>
          <Box direction="row" pad="large" width="medium" justify="center">
            <GoogleLogin
              responseType="id_token"
              clientId={config.googleConfig.clientId}
              onSuccess={responseSuccessGoogle}
              onFailure={failedGoogle}
              buttonText="Sign in with Google"
              cookiePolicy={"single_host_origin"}
              isSignedIn
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};
