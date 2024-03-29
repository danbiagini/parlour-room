import { Pool, PoolConfig } from "pg";
import { logger } from "../common/logger";
import { User, IDP, Parlour, ParlourRole } from "../common/types";
import { readFileSync } from "fs";

let PARLOUR_DB = process.env.POSTGRAPHILE_URL;

export const obfuscateDbUrl = (url: string) => {
  return url.replace(/(postgres:\/\/[\w-]+:).*(@.*)/, "$1<password>$2");
};

if (process.env.NODE_ENV === "test") {
  PARLOUR_DB = process.env.TEST_DATABASE_URL;
  logger.info(`using test database: ${PARLOUR_DB}`);
} else {
  logger.info(`parlour_db: ${obfuscateDbUrl(PARLOUR_DB)}`);
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

export const poolFromUrl = (url: string, role?: string, user?: string) => {
  let key = url;
  if (role) {
    key += role;
  }

  if (user) {
    key += user;
  }

  if (!pools[key]) {
    const config: PoolConfig = { connectionString: url };
    if (
      process.env.DB_CLIENT_CRT &&
      process.env.DB_CLIENT_KEY &&
      process.env.DB_SERVER_CRT
    ) {
      config.ssl = {
        ca: readFileSync(process.env.DB_SERVER_CRT).toString(),
        key: readFileSync(process.env.DB_CLIENT_KEY).toString(),
        cert: readFileSync(process.env.DB_CLIENT_CRT).toString(),
      };
    }
    const p = new Pool(config);

    if (role || user) {
      logger.debug(`setting (role, user): (${role}, ${user})`);
      p.on("connect", (client) => {
        if (role) {
          client.query(`SET ROLE ${role}`);
        }
        if (user) {
          client.query(
            `select set_config('parlour.user.uid', '${user}', false);`
          );
        }
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

export const deserializeParlour = (row: any) => {
  const p: Parlour = {
    uid: row.uid,
    creator_uid: row.creator_uid,
    name: row.name,
    description: row.description,
  };
  return p;
};

export const getParlourMemberRole = (
  user_uid: string,
  parlour_uid: string
): Promise<ParlourRole> => {
  const p = getParlourDbPool(process.env.DB_ADMIN_USER);

  return new Promise((resolve, reject) => {
    p.query(
      `select user_role from parlour_public.parlour_user_join 
              where user_uid = $1 and parlour_uid = $2`,
      [user_uid, parlour_uid]
    )
      .then((res) => {
        if (res.rows.length == 1) {
          resolve(res.rows[0].user_role);
        } else {
          logger.debug(
            `parlour_user_join uid = ${user_uid} not found in parlour ${parlour_uid}`
          );
          resolve(ParlourRole.NONE);
        }
      })
      .catch((err) => {
        logger.error("getParlourMemberRole failed, error:" + err);
        reject(err);
      });
  });
};

export const checkAdmin = (uid: string): Promise<ParlourRole> => {
  return getParlourMemberRole(uid, process.env.ADMIN_PARLOUR_UID);
};

export const checkUserInvite = async (
  user: User,
  invite_uid?: string
): Promise<User> => {
  const p = getParlourDbPool();
  return new Promise((res, rej) => {
    let query =
      "select * from parlour_public.invitation where (email = $1 or email = '')";
    let params: string[] = [user.email];

    if (invite_uid) {
      query += " and uid = $2";
      params.push(invite_uid);
    } else {
      query += " and requires_uid = false";
    }

    p.query(query, params)
      .then((result) => {
        if (result.rows.length == 0) {
          rej("No invite found for user");
        }
        res(user);
      })
      .catch((err) => {
        logger.error("checkUserInvite error: " + err);
        rej(err);
      });
  });
};

export const getUserByEmail = (email: string): Promise<User> => {
  const p = getParlourDbPool(process.env.DB_ADMIN_USER);

  return new Promise((resolve, reject) => {
    p.query(
      `select * from parlour_public.users inner join parlour_private.account 
              on users.uid = account.uid
              where email = $1`,
      [email]
    )
      .then((res) => {
        if (res.rows.length != 1) {
          reject("User not found for email " + email);
          return;
        }
        const user: User = deserializeUser(res.rows[0]);
        resolve(user);
      })
      .catch((err) => {
        logger.error("getUserByEmail failed, error:" + err);
        reject(err);
      });
  });
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
      "select * from parlour_private.register_user($1, $2, $3, $4, $5, $6, $7, $8, $9)",
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

    await client.query("COMMIT");
    return createdUser;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};
