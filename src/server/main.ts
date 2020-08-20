import express, { Response, Request } from "express";
import path from "path";
import { logger } from "../common/logger";
import WebSocket from "ws";
import http from "http";
import dotenv from "dotenv";
import dotenvexpand from "dotenv-expand";

dotenvexpand(dotenv.config());

import { api } from "./api";
import { graphql } from "./graphql";
import { sessions } from "./sessions";

let port = 8080;
if (process.env.PORT) {
  port = +process.env.PORT; // unary '+' => typescript for convert to number
}

export const app: express.Application = express();

// set up logger middleware for request logging
app.use((req, res, next) => {
  logger.info("Received request: " + req.method + " : " + req.originalUrl);
  next();
});

app.use(express.static(path.join(__dirname, "../public")));
app.get(["/", "/index.html"], function (req, res) {
  res.sendFile(path.join(__dirname, "../index.html"));
});

app.use(sessions);
app.use("/api", api);

// setup auth middleware for graphql
const auth = (req: Request, res: Response, next: Function) => {
  if (!req.session.user_id) {
    logger.info("auth failed, no logged in user_id on session");
    // when / if we want to support anonymous users it will probably be something like this:
    // req.session.role = process.env.DB_ANON_USER;
    return res.sendStatus(401);
  }

  logger.debug("auth success, user:" + req.session.user_id);
  next();
};

app.use("/graphql", auth, graphql);

// start the express server
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  logger.debug("Got an upgrade request");
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

if (process.env.NODE_ENV != "test") {
  server.listen(port, () => {
    logger.info(`server started at http://localhost:${port}`);
  });
}
