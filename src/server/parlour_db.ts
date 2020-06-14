import { Pool } from "pg";
import { logger } from "../common/logger";
import { User, IDP } from "../common/types";

let PARLOUR_DB = process.env.POSTGRAPHILE_URL;

if (process.env.NODE_ENV !== "production") {
  PARLOUR_DB = process.env.TEST_DATABASE_URL;
  logger.info(`using test database: ${PARLOUR_DB}`);
}

const pools = {} as {
  [key: string]: Pool;
};

export const cleanPools = () => {
  logger.debug("cleaning the pools");

  return Promise.all(
    Object.keys(pools).map(async (k: string) => {
      logger.debug(`cleaning up pool: ${k}`);
      try {
        const p = pools[k];
        delete pools[k];
        await p.end();
      } catch (e) {
        logger.error("Failed to cleanup pool: ", e);
      }
    })
  );
};

export const poolFromUrl = (url: string, role?: string) => {
  let key = url;
  if (!pools[key]) {
    const p = new Pool({ connectionString: url });
    if (role) {
      key = url + role;
      p.on("connect", (client) => {
        const q = `SET ROLE ${role}`;
        client.query(q);
      });
    }
    p.on("error", (err, client) => {
      logger.error(`DB client ${client}  emitted error ${err}`);
    });
    logger.debug(`created pool: ${key}`);
    pools[key] = p;
  }
  return pools[key];
};

export const getParlourDbPool = (role?: string) => {
  return poolFromUrl(PARLOUR_DB, role);
};

export const loginUser = async (idp: IDP, idp_id: string) => {
  const p = getParlourDbPool();
  let user: User = {
    isSignedIn: false,
  };
  logger.silly(`searching for user idp: ${idp} and id: ${idp_id}`);
  await p
    .query("select * from parlour_private.login_user($1, $2)", [idp_id, idp])
    .then((result) => {
      if (result.rows.length != 1) {
        // This shouldn't happen, the pgsql function should raise an exception in this case
        logger.error(`loginUser returned ${result.rows.length} rows.`);
        throw new Error(`loginUser returned ${result.rows.length} rows.`);
      }
      logger.silly(
        `loginUser rowCount: ${result.rowCount}, rows.length: ${result.rows.length} result row[0]: ${result.rows[0]}`
      );
      user = {
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
        username: result.rows[0].username,
        email: result.rows[0].email,
        about: result.rows[0].about,
        profPicUrl: result.rows[0].prof_img_url,
        uid: result.rows[0].uid,
        isSignedIn: true,
        idp: idp,
        idpId: idp_id,
      };
    })
    .catch((error) => {
      logger.debug(`error in login_user: ${error}`);
      throw error;
    });
  logger.silly(`loginUser query success, returning user ${user}`);
  return user;
};

export const regUser = async (user: User) => {
  const p = getParlourDbPool();

  // this may throw, but connection won't get created per node-postgres docs
  const client = await p.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      "select * from parlour_public.register_user($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        user.username,
        user.lastName,
        user.firstName,
        user.email,
        user.about,
        user.profPicUrl,
        user.idp,
        user.idpId,
      ]
    );
    if (result.rows.length != 1) {
      throw Error("regUser: Unexpected result rows " + result.rows.length);
    }
    const createdUser: User = {
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
      username: result.rows[0].username,
      email: result.rows[0].email,
      about: result.rows[0].about,
      profPicUrl: result.rows[0].prof_img_url,
      isSignedIn: false,
      idp: user.idp, // idp is not present in the register_user response
      idpId: user.idpId, // idp_id is not present in the register_user response
      uid: result.rows[0].uid,
    };
    await client.query("COMMIT");
    return createdUser;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};