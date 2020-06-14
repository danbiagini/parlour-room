import * as express from "express";
import { logger } from "../common/logger";
import {
  loginWithGoogleIdToken,
  registerWithGoogleIdToken,
} from "./google_utils";
import { User } from "../common/types";

export const api = express.Router();
api.use(express.json());

api.get("/auth/:idp/login", async (req, res) => {
  logger.silly(
    `beginning /auth/:idp/login w/ query param: ${JSON.stringify(req.query)}`
  );
  if (req.params.idp != "google.com") {
    return res.status(400).json("Unsupported IDP").send();
  }
  if (!req.query.code) {
    logger.info("no code on auth/google request:" + JSON.stringify(req.params));
    return res.status(401).json("no auth code present");
  }
  await loginWithGoogleIdToken(req.query.code.toString())
    .then((user) => {
      if (user.email) {
        logger.info("got the email ${user.email}, lets render!");
      }

      if (user.lastName || user.firstName) {
        logger.info("got the full name: ${user.firstName} ${user.lastName}");
      }
      return res.json(user);
    })
    .catch((err) => {
      logger.debug(`token invalid, err: ${err}`);
      if (err == "Error: Token used too late,") {
        return res.status(401).json("Token expired").send();
      } else if (err == "error: idp_id not found") {
        return res.status(403).json("User not found").send();
      }
      return res.status(401).json("code invalid").send();
    });
});

api.post("/auth/:idp/register", async (req, res) => {
  logger.silly(
    `beginning /auth/:idp/register w/ query param: ${JSON.stringify(req.query)}`
  );
  if (req.params.idp != "google.com") {
    return res.status(400).json("Unsupported IDP").send();
  }

  if (!req.query.code) {
    logger.info("no code on auth/google request:" + JSON.stringify(req.params));
    return res.status(401).json("no auth code present");
  }

  if (!req.accepts("application/json")) {
    return res.status(406).send();
  }

  if (!req.is("json")) {
    return res.status(415).send();
  }

  const postUser: User = req.body;
  await registerWithGoogleIdToken(req.query.code.toString(), postUser)
    .then((user) => {
      if (user.email) {
        logger.silly(`got the email ${user.email}, lets render!`);
      }

      if (user.lastName || user.firstName) {
        logger.silly(`got the full name: ${user.firstName} ${user.lastName}`);
      }
      return res.json(user);
    })
    .catch((err) => {
      logger.debug(`token invalid, err: ${err}`);
      if (err == "Error: Token used too late,") {
        return res.status(401).json("Token expired").send();
      } else if (err == "Error: Registration error, user already exists.") {
        return res.status(409).json("User already exists").send();
      }
      return res.status(401).json("code invalid").send();
    });
});
