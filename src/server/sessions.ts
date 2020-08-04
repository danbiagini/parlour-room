// import ConnectPgSimple from "connect-pg-simple";
// import * as express from "express";
import session from "express-session";
import { getParlourDbPool } from "./parlour_db";
import { Pool } from "pg";
import { logger } from "../common/logger";

// const PgStore = ConnectPgSimple(session);

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

const MAXIMUM_SESSION_DURATION_IN_MILLISECONDS =
  parseInt(process.env.MAXIMUM_SESSION_DURATION_IN_MILLISECONDS || "", 10) ||
  3 * DAY;

const pgPool = getParlourDbPool(DB_POSTGRAPHILE_USER);

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

export const sessions = session({
  // store: new ParlourSessionStore({
  //   pool: pgPool,
  //   schemaName: "parlour_private",
  //   tableName: "connect_pg_simple_session",
  // }),
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
