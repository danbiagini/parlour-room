import express from "express";
import path from "path";
import { logger } from "../common/logger";
import WebSocket from "ws";
import http from "http";

import { api } from "./api";

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
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use("/api", api);

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
