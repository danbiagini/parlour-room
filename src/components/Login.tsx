import React from "react";
import * as config from "../utils/config";
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";
import pp_logo from "../public/pparlour-logo.png";

interface IProps {
  isSignedIn: boolean;
}

const Login: React.FC<IProps> = (props: IProps) => {
  const responseSuccessGoogle = (response: GoogleLoginResponse) => {
    const whoami = response.getBasicProfile();
    console.log(`${JSON.stringify(response)} hi ${whoami.getEmail()}`);
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
    <div className="Login">
      <div>
        <h3>Sign In</h3>
        <img src={pp_logo} className="App-logo" alt="logo" />
        <p>You are not signed in. Click below to sign in using google.</p>
        <GoogleLogin
          clientId={config.googleConfig.clientId}
          // buttonText="Login with Google"
          onSuccess={responseSuccessGoogle}
          onFailure={failedGoogle}
          isSignedIn={props.isSignedIn}
        />
      </div>
    </div>
  );
};

export default Login;
