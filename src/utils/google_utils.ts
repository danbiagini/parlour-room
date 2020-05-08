import { google } from "googleapis";
import axios from "axios";
import { logger } from "./logger";
import * as config from "./config";

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



/**
 * Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
 */
function getConnectionUrl(auth: any) {
	return auth.generateAuthUrl({
		access_type: "offline",
		prompt: "consent", // access type and approval prompt will force a new refresh token to be made each time signs in
		scope: config.defaultScope
	});
}

/**
 * Create the google url to be sent to the client.
 */
function urlGoogle() {
	const auth = createConnection(); // this is from previous step
	const url = getConnectionUrl(auth);
	return url;
}

async function getAccessTokenFromCode(code: string) {
	const { data } = await axios({
		url: "https://oauth2.googleapis.com/token",
		method: "post",
		data: {
			client_id: config.googleConfig.clientId,
			client_secret: config.googleConfig.clientSecret,
			redirect_uri: config.googleConfig.redirect,
			grant_type: "authorization_code",
			code,
		},
	});

	logger.info(data); // { access_token, expires_in, token_type, refresh_token }
	return data.access_token;
}

async function getGoogleUser(accessToken: string) {
	const { data } = await axios({
		url: "https://www.googleapis.com/oauth2/v2/userinfo",
		method: "get",
		headers: {
			Authorization: `Bearer ${accessToken}`
		},
	});
	logger.info(data);
	return (data);
}

export { urlGoogle, getAccessTokenFromCode, getGoogleUser };
