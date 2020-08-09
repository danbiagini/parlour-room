import { Pool } from "pg";
import { logger } from "../common/logger";
import { User, IDP } from "../common/types";

let PARLOUR_DB = process.env.POSTGRAPHILE_URL;
const PARLOUR_ROOT_URL = process.env.PARLOUR_ROOT_URL;

const obfuscateDbUrl = (url: string) => {
  return url.replace(/(postgres:\/\/[\w-]+:).*(@.*)/, "$1<password>$2");
};

if (process.env.NODE_ENV === "test") {
  PARLOUR_DB = process.env.TEST_DATABASE_URL;
  logger.info(`using test database: ${PARLOUR_DB}`);
} else {
  logger.info(`parlour_db: ${obfuscateDbUrl(PARLOUR_DB)}`);
  logger.info(`parlour root db: ${obfuscateDbUrl(PARLOUR_ROOT_URL)}`);
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
  if (role) {
    key += role;
  }

  if (!pools[key]) {
    const p = new Pool({ connectionString: url });
    if (role) {
      p.on("connect", (client) => {
        const q = `SET ROLE ${role}`;
        client.query(q);
      });
    }
    p.on("error", (err, client) => {
      logger.error(`DB client ${client}  emitted error ${err}`);
    });
    logger.debug(`created pool: ${obfuscateDbUrl(key)}`);
    pools[key] = p;
  }
  return pools[key];
};

export const getParlourDbPool = (role?: string) => {
  return poolFromUrl(PARLOUR_DB, role);
};

export const getParlourRootDbPool = () => {
  return poolFromUrl(PARLOUR_ROOT_URL);
};

// export const coerceDateFromPgTimestamp = (stamp: string): Date => {
//   const maybeEpoch = parseInt(stamp, 10);
//   if (isNaN(maybeEpoch)) {
//     stamp.match(
//       /(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2}\.\d{3})\d*(\+\d{2})?(:\d{2})?/
//     );
//     // yyyy-mm-ddThh:mm:ss.mmm+TZ
//     const withTz: string = stamp[0] + "T" + stamp[1];
//     if (stamp[3]) {
//       withTz.concat(stamp[3]);
//       if (stamp[4]) {
//         withTz.concat(stamp[4]);
//       }
//     } else {
//       withTz.concat("+00:00");
//     }
//     return new Date(withTz);
//   }

//   // its an epoch!
//   return new Date(maybeEpoch * 1000);
// };

const deserializeUser = (row: any) => {
  const user: User = {
    isSignedIn: false,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    email: row.email,
    email_subscription: row.email_subscription,
    about: row.about,
    profPicUrl: row.prof_img_url,
    uid: row.uid,
    lastSignin: row.recent_login,
    idp: row.idp,
    idpId: row.idp_id,
  };
  if (isNaN(row.recent_login)) {
    // not an epoch, try to convert postgresql timestamp output to Date compatible
    user.lastSignin = new Date(row.recent_login);
  }
  return user;
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
      let row = result.rows[0];
      user = deserializeUser(row);
      user.isSignedIn = true;
      user.idp = idp;
      user.idpId = idp_id;
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
      "select * from parlour_public.register_user($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [
        user.username,
        user.lastName,
        user.firstName,
        user.email,
        user.email_subscription ? user.email_subscription : false,
        user.about,
        user.profPicUrl,
        user.idp,
        user.idpId,
      ]
    );
    if (result.rows.length != 1) {
      throw Error("regUser: Unexpected result rows " + result.rows.length);
    }
    const createdUser = deserializeUser(result.rows[0]);
    createdUser.idp = user.idp;
    createdUser.idpId = user.idpId;
    createdUser.isSignedIn = false;

    // const createdUser: User = {
    //   firstName: result.rows[0].first_name,
    //   lastName: result.rows[0].last_name,
    //   username: result.rows[0].username,
    //   email: result.rows[0].email,
    //   email_subscription: result.rows[0].email_subscription,
    //   about: result.rows[0].about,
    //   profPicUrl: result.rows[0].prof_img_url,
    //   isSignedIn: false,
    //   idp: user.idp, // idp is not present in the register_user response
    //   idpId: user.idpId, // idp_id is not present in the register_user response
    //   uid: result.rows[0].uid,
    // };
    await client.query("COMMIT");
    return createdUser;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};
