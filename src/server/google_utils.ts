import { google } from "googleapis";
import { logger } from "../common/logger";
import * as config from "../common/config";

import { loginUser, regUser } from "./parlour_db";
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

const validateGoogleToken = async (token: string) => {
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
    .then(async (ticket) => {
      const payload = await ticket.getPayload();
      authUser.idpId = payload["sub"];
      if (
        payload["iss"] != "accounts.google.com" &&
        payload["iss"] != "https://accounts.google.com"
      ) {
        logger.debug(
          `token issuer not accounts.google.com, iss: ${payload["iss"]}`
        );
        throw Error("invalid issuer for google.com IDP");
      }
      const hostedDomain = payload["hd"];
      if (hostedDomain) {
        logger.debug(
          `got a login for non google.com domain --> ${hostedDomain}`
        );
        throw Error("invalid domain for Google authentication");
      }
      logger.debug(`got a valid token, ID for ${authUser.idpId}`);
      authUser.idp = IDP.GOOGLE;
    })
    .catch((error) => {
      throw error;
    });
  return authUser;
};

export const registerWithGoogleIdToken = async (
  token: string,
  newUser: User
) => {
  let authUser = await validateGoogleToken(token);
  // make sure new user has the idp & id that were in the auth token!
  newUser.idp = authUser.idp;
  newUser.idpId = authUser.idpId;

  return await regUser(newUser);
};

const loginWithGoogleIdToken = async (token: string) => {
  let authUser = await validateGoogleToken(token);

  // Lets see if this user exists
  await loginUser(authUser.idp, authUser.idpId)
    .then((result) => {
      // found a user!
      authUser = result;
      authUser.isSignedIn = true;
    })
    .catch((error) => {
      if (error == "error: idp_id not found") {
        logger.silly(`user not found: ${error}`);
      } else {
        logger.error(`Sql login_user function returned: ${error}`);
      }
      throw error;
    });
  return authUser;
};

export { loginWithGoogleIdToken };
