import { google } from 'googleapis';
import axios from 'axios';
import { logger } from './logger';

const googleConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID, // e.g. asdfghjkljhgfdsghjk.apps.googleusercontent.com
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // e.g. _ASDFA%DFASDFASDFASD#FAD-
    redirect: process.env.PROTO + process.env.FQDN +
        (process.env.NODE_ENV === "development" ? ":" + process.env.PORT : '') +
        process.env.GOOGLE_REDIRECT_PATH // this must match your google api settings
};

const defaultScope = [
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
]
/**
 * Create the google auth object which gives us access to talk to google's apis.
 */
function createConnection() {
    return new google.auth.OAuth2(
        googleConfig.clientId,
        googleConfig.clientSecret,
        googleConfig.redirect
    );
}



/**
 * Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
 */
function getConnectionUrl(auth: any) {
    return auth.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
        scope: defaultScope
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
        url: `https://oauth2.googleapis.com/token`,
        method: 'post',
        data: {
            client_id: googleConfig.clientId,
            client_secret: googleConfig.clientSecret,
            redirect_uri: googleConfig.redirect,
            grant_type: 'authorization_code',
            code,
        },
    });

    logger.info(data); // { access_token, expires_in, token_type, refresh_token }
    return data.access_token;
};

async function getGoogleUser(accessToken: string) {
    const { data } = await axios({
        url: `https://www.googleapis.com/oauth2/v2/userinfo`,
        method: 'get',
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
    });
    logger.info(data);
    return (data);
}

export { urlGoogle, getAccessTokenFromCode, getGoogleUser }
