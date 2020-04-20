import express from "express";
import path from "path";
import dotenv from "dotenv";
import { transports, format, createLogger } from "winston";
import {logger} from "./logger";

dotenv.config();

import { urlGoogle, getAccessTokenFromCode, getGoogleUser } from "./google_utils.js";
import { url } from "inspector";

let port = 8080;
if (process.env.PORT) {
    port = +process.env.PORT; // unary '+' => typescript for convert to number
}

const app: express.Application = express();

// set up logger middleware for request logging
app.use((req, res, done) => {
    logger.info("Received request: " + req.originalUrl);
    done();
});

// Configure Express to use EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

interface IndexInfo {
    authUrl: string;
    userFullName: string;
    userEmail: string;
};

const index: IndexInfo = {
    authUrl: urlGoogle(),
    userFullName: "",
    userEmail: ""
};

const authUrl:string = urlGoogle();

// define a route handler for the default home page
app.get("/", (req, res) => {
    // render the index template
    res.render("index", index);
});

app.get("/auth/google", (req, res) => {
    if (req.query.code) {
        const userInfo =
            getAccessTokenFromCode(req.query.code.toString())
                .then((ptoken) => {
                    logger.info("we made it, token:" + ptoken.toString());
                    return getGoogleUser(ptoken);
                })
                .then((user) => {
                    if (user.email) {
                        logger.info("got the email ${user.email}, lets render!");
                        index.userEmail = user.email.toString();
                    }

                    if (user.name) {
                        logger.info("got the full name: ${user.name}");
                        index.userFullName = user.name.toString();
                    }
                    res.render("index", index);
                })
                .catch(() => {
                    logger.info("Unable to get google user info");
                });
    } else {
        logger.info("no code on auth/google request:" + req.params)
        res.render("index", index);
    }
});

// start the express server
app.listen(port, () => {
    logger.info(`server started at http://localhost:${port}`);
});
