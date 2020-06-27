import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Layer,
  Form,
  FormField,
  TextArea,
  Button,
  Avatar,
  TextInput,
} from "grommet";
import { FormFieldLabel } from "./FormFieldLabel";

import { Redirect } from "react-router";
import { useSelector } from "react-redux";

// import pp_logo from "../public/pparlour-logo.png";
import * as config from "../common/client_config";
import { Alert } from "./Alert";
import { RootState } from "../store/index";
import { Halt, Edit, Clear, User as UserAvatar } from "grommet-icons";
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";
import { User, IDP } from "../common/types";
// import { serverReg } from "./Auth";
// import { signinIdp, signoutIdp } from "../store/actions";

export const SignUp: React.FC = () => {
  const isSignedIn = useSelector((state: RootState) => state.isSignedIn);
  const currentUser = useSelector((state: RootState) => state);
  const [goHome, setGoHome] = useState(false);
  const [formUser, setFormUser] = useState(currentUser);
  const [editAvatar, setEditAvatar] = useState(false);
  const showHelp = false; // TODO add a button or something

  const idpId = formUser.idpId;

  const handleGoHome = () => {
    setGoHome(true);
  };

  const failedGoogle = (error: any) => {
    console.log(`failGoogle: ${JSON.stringify(error)}`);
  };

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

    setFormUser(newUser);
  };

  const submitRegForm = (event: any) => {
    console.log("submitted: " + JSON.stringify(event.value));
  };

  const clearAvatar = () => {
    setFormUser({ ...formUser, profPicUrl: "" });
  };

  if (goHome) {
    return <Redirect to="/" />;
  }

  if (isSignedIn) {
    return (
      <Alert onClose={handleGoHome} background="status-warning">
        <Halt />
        <Text>Already signed in!</Text>
      </Alert>
    );
  }

  let idpPrompt = undefined;
  if (!idpId) {
    idpPrompt = (
      <Layer
        position="center"
        onClickOutside={handleGoHome}
        onEsc={handleGoHome}
      >
        <Box pad="medium" gap="small" width="medium">
          <Heading level={3}>Get started by signing in with Google</Heading>
          <Text>
            {"Parlour uses your social login to get basic profile information only. " +
              " Don't worry, you will see what info will be used before signing up."}
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
      </Layer>
    );
  }

  return (
    <Box
      fill="vertical"
      justify="center"
      margin="medium"
      align="center"
      overflow="scroll"
    >
      {idpPrompt ? idpPrompt : <div />}
      <Box>
        <Heading level={3}>Register new user</Heading>
        <Form
          value={formUser}
          onSubmit={submitRegForm}
          onReset={() => setFormUser(currentUser)}
          validate="blur"
        >
          <FormFieldLabel
            component={TextInput}
            label="Username"
            name="username"
            placeholder="Enter a username"
            help={
              showHelp &&
              "Unique username. Alpha-numeric, no spaces. May include '-' as a separator."
            }
            validate={{
              regexp: /^[A-Za-z0-9-]{3,32}$/,
              message:
                "Alpha-numeric, dashes or underscores.  Between 3 & 32 characters",
            }}
            required
          />
          <FormFieldLabel
            component={TextInput}
            label="First Name"
            name="firstName"
          />
          <FormFieldLabel
            component={TextInput}
            label="Last Name"
            name="lastName"
          />
          <FormFieldLabel
            component={TextInput}
            label="Email"
            name="email"
            help={showHelp && "Set via your Google account"}
            disabled
          />
          <FormField
            label={
              <Box gap="small">
                <Text>Profile Picture</Text>
                <Box direction="row" gap="small">
                  {formUser.profPicUrl ? (
                    <Avatar size="xlarge" src={formUser.profPicUrl} />
                  ) : (
                    <Avatar size="xlarge">
                      <UserAvatar size="large" />
                    </Avatar>
                  )}
                  <Box gap="medium" justify="center">
                    <Button onClick={() => setEditAvatar(!editAvatar)}>
                      <Edit size="medium" />
                    </Button>
                    <Button onClick={clearAvatar}>
                      <Clear size="medium" />
                    </Button>
                  </Box>
                </Box>
              </Box>
            }
            name="profPicUrl"
            disabled={!editAvatar}
          >
            <TextInput
              disabled={!editAvatar}
              name="profPicUrl"
              placeholder="https://google.com/my-pic.jpg"
            />
          </FormField>
          <FormFieldLabel label="About" name="about" component={TextArea} />
          <Box
            direction="row"
            justify="between"
            margin={{ top: "medium" }}
            gap="medium"
          >
            <Button type="submit" label="Submit" primary />
            <Button label="Cancel" />
            <Text
              margin={{ left: "small" }}
              size="small"
              color="status-critical"
            >
              * Required Field
            </Text>
          </Box>
        </Form>
      </Box>
    </Box>
  );
};
