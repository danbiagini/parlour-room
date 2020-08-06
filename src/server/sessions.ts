import ConnectPgSimple from "connect-pg-simple";
// import * as express from "express";
import session from "express-session";
import { getParlourRootDbPool } from "./parlour_db";
import { Pool } from "pg";
import { logger } from "../common/logger";

const MILLISECOND = 1;
const SECOND = 1000 * MILLISECOND;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const { SESSION_SECRET } = process.env;
const { DB_POSTGRAPHILE_USER } = process.env;

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET required");
}

if (!DB_POSTGRAPHILE_USER) {
  throw new Error("DB_POSTGRAPHILE_USER required");
}

export const MAXIMUM_SESSION_DURATION_IN_MILLISECONDS =
  parseInt(process.env.MAXIMUM_SESSION_DURATION_IN_MILLISECONDS, 10) || 3 * DAY;

const pgPool = getParlourRootDbPool();

interface ParlourStoreOptions {
  pool: Pool;
  schemaName: string;
  tableName: string;
}

class ParlourSessionStore extends session.Store {
  pool: Pool;
  schema: string;
  table: string;

  noop: Function = () => {};

  constructor(opts: ParlourStoreOptions) {
    super();
    this.pool = opts.pool;
    this.schema = opts.schemaName;
    this.table = opts.tableName;
  }

  destroy = (sid: string, cb = this.noop) => {
    cb(new Error("destroy not implemented"));
  };

  get = (sid: string, cb = this.noop) => {
    cb(new Error("get not implemented"));
  };

  set = (sid: string, ses: Express.SessionData, cb = this.noop) => {
    logger.debug("Setting cookie:", sid);
    cb(new Error("set not implemented"));
  };

  touch = (sid: string, sess: Express.SessionData, cb = this.noop) => {
    cb(new Error("touch not implemented"));
  };
}

const pgStore = ConnectPgSimple(session);

export interface ParlourSession {
  sid: string;
  sess: {
    cookie?: string;
    user_id?: string;
  };
  expires: Date;
  updated_at: Date;
  created_at: Date;
}

export const nullSession: Readonly<ParlourSession> = {
  sid: undefined,
  sess: {},
  expires: undefined,
  updated_at: undefined,
  created_at: undefined,
};

export const sessions = session({
  store: new pgStore({
    pool: pgPool,
    schemaName: "parlour_private",
    tableName: "login_session",
  }),
  secret: SESSION_SECRET,
  name: "parlourSession",
  cookie: {
    maxAge: MAXIMUM_SESSION_DURATION_IN_MILLISECONDS,
    httpOnly: true,
    sameSite: "strict",
    secure: "auto",
  },
  saveUninitialized: false,
  resave: false,
});

export const findSession = async (sid: string): Promise<ParlourSession> => {
  logger.silly(`searching for session sid: ${sid}`);
  return new Promise((resolve, reject) => {
    getParlourRootDbPool()
      .query(
        "select extract('epoch' from expire) * 1000 as expire_epoch, * from parlour_private.login_session where sid = $1",
        [sid]
      )
      .then((result) => {
        if (result.rows.length == 1) {
          logger.silly(
            `findSession rowCount: ${result.rowCount}, rows.length: ${result.rows.length} result row[0]: ${result.rows[0].expire}`
          );
          const session: ParlourSession = {
            sid: result.rows[0].sid,
            sess: result.rows[0].sess,
            expires: new Date(result.rows[0].expire_epoch),
            created_at: new Date(result.rows[0].created_at),
            updated_at: new Date(result.rows[0].updated_at),
          };
          resolve(session);
        }
        resolve(nullSession);
      })
      .catch((error) => {
        logger.debug(`error in findSession: ${error}`);
        reject(error);
      });
  });
};
