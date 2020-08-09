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

const errorResponse = (
  res: express.Response,
  code: number,
  message: string
) => {
  return res.status(code).json({ message: message }).send();
};

api.get("/auth/logout", async (req, res) => {
  if (!req.header("cookie")) {
    logger.debug("couldn't find a session cookie to logout");
    return res.status(403).send();
  }

  logger.silly(
    "found session cookie in logout:" +
      req.header("cookie") +
      ", session:" +
      req.session.id
  );
  req.session.destroy((err) => {
    if (err) logger.error("couldn't destroy session:", err);
  });
  return res.status(200).send();
});

api.get("/auth/:idp/login", async (req, res) => {
  logger.debug(
    `beginning /auth/:idp/login w/ query param: ${JSON.stringify(req.query)}`
  );
  if (!req.params.idp || req.params.idp != "google.com") {
    return errorResponse(res, 400, "Unsupported IDP");
  }

  let id_token: string = req.id_token;

  if (!id_token) {
    logger.info("no code on auth/google request:" + JSON.stringify(req.params));
    return errorResponse(res, 401, "no auth code present");
  }

  await loginWithGoogleIdToken(id_token)
    .then((user) => {
      if (user.email) {
        logger.silly("got the email ${user.email}, lets render!");
      }

      if (user.lastName || user.firstName) {
        logger.silly("got the full name: ${user.firstName} ${user.lastName}");
      }

      req.session.user_id = user.uid;
      return res.json(user);
    })
    .catch((err) => {
      logger.debug(`token invalid, err: ${err}`);
      if (err == "Error: Token used too late,") {
        return errorResponse(res, 401, "Token expired");
      } else if (err == "error: idp_id not found") {
        return errorResponse(res, 403, "User not found");
      }
      return errorResponse(res, 401, "code invalid");
    });
});

api.post("/auth/:idp/register", async (req, res) => {
  logger.debug(
    `beginning /auth/:idp/register w/ query param: ${JSON.stringify(req.query)}`
  );
  if (req.params.idp != "google.com") {
    return errorResponse(res, 400, "Unsupported IDP");
  }

  if (!req.id_token) {
    logger.info("no code on auth/google request:" + JSON.stringify(req.params));
    return errorResponse(res, 401, "no auth code present");
  }

  if (!req.accepts("application/json")) {
    return errorResponse(res, 406, "Invalid accepted content type");
  }

  if (!req.is("json")) {
    return errorResponse(res, 415, "Invalid content type");
  }

  const postUser: User = req.body;
  await registerWithGoogleIdToken(req.id_token, postUser)
    .then((user) => {
      logger.debug("created new user: " + JSON.stringify(user));
      user.isSignedIn = true;
      req.session.user_id = user.uid;
      return res.json(user);
    })
    .catch((err) => {
      logger.debug(`token invalid, err: ${err}`);
      if (err == "Error: Token used too late,") {
        return errorResponse(res, 401, "Token expired");
      } else if (
        err ==
        'error: duplicate key value violates unique constraint "users_username_key"'
      ) {
        return errorResponse(res, 409, "User already exists");
      } else if (
        err == "Error: email not verified" ||
        err == "Error: user email doesn't match token"
      ) {
        return errorResponse(res, 409, err.toString());
      }
      return errorResponse(res, 401, "code invalid");
    });
});
