import * as express from "express";
import { logger } from "../common/logger";
import {
  loginWithGoogleIdToken,
  registerWithGoogleIdToken,
} from "./google_utils";
import { User } from "../common/types";

declare global {
  namespace Express {
    interface Request {
      id_token?: string;
    }
  }
}
export const api = express.Router();
api.use(express.json());

const getIdTokenFromRequest = (
  req: express.Request,
  res: express.Response,
  next: Function
) => {
  if (req.header("Authorization")) {
    let auth_hdr = req.header("Authorization").split(" ");
    if (auth_hdr.length === 2 && auth_hdr[0] === "Bearer") {
      req.id_token = auth_hdr[1];
      next();
      return;
    }
  }

  if (!req.id_token && req.query.code) {
    req.id_token = req.query.code as string;
    next();
    return;
  }
  next();
};

api.use(getIdTokenFromRequest);

api.get("/auth/:idp/login", async (req, res) => {
  logger.debug(
    `beginning /auth/:idp/login w/ query param: ${JSON.stringify(req.query)}`
  );
  if (req.params.idp != "google.com") {
    return res.status(400).json("Unsupported IDP").send();
  }

  let id_token: string = req.id_token;

  if (!id_token) {
    logger.info("no code on auth/google request:" + JSON.stringify(req.params));
    return res.status(401).json("no auth code present");
  }

  await loginWithGoogleIdToken(id_token)
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
  logger.debug(
    `beginning /auth/:idp/register w/ query param: ${JSON.stringify(req.query)}`
  );
  if (req.params.idp != "google.com") {
    return res.status(400).json("Unsupported IDP").send();
  }

  if (!req.id_token) {
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
  await registerWithGoogleIdToken(req.id_token, postUser)
    .then((user) => {
      logger.debug("created new user: " + JSON.stringify(user));
      user.isSignedIn = true;
      return res.json(user);
    })
    .catch((err) => {
      logger.debug(`token invalid, err: ${err}`);
      if (err == "Error: Token used too late,") {
        return res.status(401).json("Token expired").send();
      } else if (
        err ==
        'error: duplicate key value violates unique constraint "user_username_key"'
      ) {
        return res.status(409).json("User already exists").send();
      } else if (
        err == "Error: email not verified" ||
        err == "Error: user email doesn't match token"
      ) {
        return res.status(409).json(err.toString());
      }
      return res.status(401).json("code invalid").send();
    });
});
