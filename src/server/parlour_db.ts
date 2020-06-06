import { Pool } from "pg";
import { logger } from "../common/logger";
import { User, IDP } from "../common/types";

let PARLOUR_DB = process.env.POSTGRAPHILE_URL;

if (process.env.NODE_ENV !== "production") {
  PARLOUR_DB = process.env.TEST_DATABASE_URL;
  logger.debug(`using test database: ${PARLOUR_DB}`);
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
