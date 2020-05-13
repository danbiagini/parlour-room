import express from "express";
import path from "path";
import dotenv from "dotenv";
// import { transports, format, createLogger } from 'winston';
import { logger } from "./utils/logger";
import WebSocket from "ws";
import http from "http";

dotenv.config();

import {
  urlGoogle,
  getAccessTokenFromCode,
  getGoogleUser,
} from "./utils/google_utils.js";
// import { url } from 'inspector';

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

app.use(express.static(path.join(__dirname, "../public")));
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Configure Express to use EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

interface IndexInfo {
  authUrl: string;
  userFullName: string;
  userEmail: string;
}

const index: IndexInfo = {
  authUrl: urlGoogle(),
  userFullName: "",
  userEmail: "",
};

// const authUrl:string = urlGoogle();

// define a route handler for the default home page
// app.get("/", (req, res) => {
//   // render the index template
//   res.render("index", index);
// });

app.get("/auth/google", (req, res) => {
  if (req.query.code) {
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
    logger.info("no code on auth/google request:" + req.params);
    res.render("index", index);
  }
});

// start the express server
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  logger.silly("Got an upgrade request");
  const pathName = req.url;
  if (pathName === "/socket") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    logger.info("No websocket listener on " + req.url);
  }
});

wss.on("connection", (sock, request) => {
  logger.info("Connection received:" + request.url);

  sock.on("message", (message) => {
    logger.info(`Received message ${message}`);
  });

  sock.on("close", (event: CloseEvent) => {
    logger.info("connection closed, reason:" + event.code);
  });
});

wss.on("close", () => {
  logger.info("Websocket server closed");
});

server.listen(port, () => {
  logger.info(`server started at http://localhost:${port}`);
});
