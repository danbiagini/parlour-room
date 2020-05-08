"use strict";
exports.__esModule = true;
exports.googleConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirect: process.env.PROTO + process.env.FQDN +
        (process.env.NODE_ENV === "development" ? ":" + process.env.PORT : "") +
        process.env.GOOGLE_REDIRECT_PATH // this must match your google api settings
};
exports.defaultScope = [
    "https://www.googleapis.com/auth/plus.me",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid"
];
