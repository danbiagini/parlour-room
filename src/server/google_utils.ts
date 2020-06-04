import { google } from "googleapis";
import axios from "axios";
import { logger } from "../common/logger";
import * as config from "../common/config";

import { loginUser } from "./parlour_db";
import { User, IDP } from "../common/types";

/**
 * Create the google auth object which gives us access to talk to google's apis.
 */
function createConnection() {
  return new google.auth.OAuth2(
    config.googleConfig.clientId,
    config.googleConfig.clientSecret,
    config.googleConfig.redirect
  );
}

const gOauth = createConnection();

const gClient = axios.create({
  responseType: "json",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
 */
function getConnectionUrl(auth: any) {
  return auth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // access type and approval prompt will force a new refresh token to be made each time signs in
    scope: config.defaultScope,
  });
}

/**
 * Create the google url to be sent to the client.
 */
function urlGoogle() {
  const url = getConnectionUrl(gOauth);
  return url;
}

const loginWithGoogleIdToken = async (token: string) => {
  let authUser: User = {
    isSignedIn: false,
    idp: IDP.NONE,
    idpId: "",
  };
  await gOauth
    .verifyIdToken({
      idToken: token,
      audience: config.googleConfig.clientId,
    })
    .then((ticket) => {
      const payload = ticket.getPayload();
      authUser.idpId = payload["sub"];
      const domain = payload["hd"];
      if (payload["iss"] != "accounts.google.com") {
        logger.debug(
          `token issuer not accounts.google.com, iss: ${payload["iss"]}`
        );
        throw Error("invalid issuer for google.com IDP");
      }
      logger.debug(`got a valid ID for ${authUser.idpId} in domain ${domain}`);
      if (domain != IDP.GOOGLE) {
        logger.debug(`got a login for non google.com domain --> ${domain}`);
        throw Error("invalid domain for Google authentication");
      }
      authUser.idp = IDP.GOOGLE;
    });

  // Lets see if this user exists
  await loginUser(authUser.idp, authUser.idpId)
    .then((result) => {
      // found a user!
      authUser = result;
    })
    .catch((error) => {
      if (error == "idp_id not found") {
        logger.silly(`Sql query error in function login_user: ${error}`);
      } else {
        logger.debug(`Sql login_user function returned error: ${error}`);
      }
      throw error;
    });
  return authUser;
};

async function getAccessTokenFromCode(code: string) {
  await gClient
    .post("https://oauth2.googleapis.com/token", {
      client_id: config.googleConfig.clientId,
      client_secret: config.googleConfig.clientSecret,
      redirect_uri: config.googleConfig.redirect,
      grant_type: "authorization_code",
      code,
    })
    .then((res) => {
      logger.info(res.data); // { access_token, expires_in, token_type, refresh_token }
      return res.data.access_token;
    })
    .catch((err) => {
      logger.error("unable to get access token, err:" + err);
      throw err;
    });
  return "";
}

async function getGoogleUser(accessToken: string) {
  const { data } = await axios({
    url: "https://www.googleapis.com/oauth2/v2/userinfo",
    method: "get",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  logger.info(data);
  return data;
}

export {
  loginWithGoogleIdToken,
  urlGoogle,
  getAccessTokenFromCode,
  getGoogleUser,
};
