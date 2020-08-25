import * as types from "../../common/types";
import {
  poolFromUrl,
  regUser,
  deserializeParlour,
} from "../../server/parlour_db";
import { logger } from "../../common/logger";

/*
 * We need to inform jest that these files depend on changes to the database,
 * so we write a dummy file after current.sql is imported. This file has to be
 * tracked by git, otherwise `jest --watch` won't pick up changes to it...
 */
import { ts } from "./jest.watch.hack";
import { QueryResult } from "pg";
if (ts && process.env.NODE_ENV === "test") {
  /*
   * ... but we don't want the changes showing up under git, so we throw
   * them away again once the tests have been triggered.
   */
  require("fs").writeFileSync(
    `${__dirname}/jest.watch.hack.ts`,
    "export const ts: any = null;\n"
  );
  /*
   * This will trigger Jest's file watching again, but the second time
   * `ts` will be null (as above), so:
   *
   *   a) it won't happen a third time, and
   *   b) there will be no git diff, so the tests won't need to re-run
   */
}

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Can't run tests without a TEST_DATABASE_URL");
}

if (!process.env.PARLOUR_ROOT_URL) {
  throw new Error("Can't run tests without a PARLOUR_ROOT_URL");
}

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
export const DB_ANON_USER = process.env.DB_ANON_USER;
export const DB_ROOT_USER = process.env.DB_PARLOUR_ROOT_USER;
export const DB_ADMIN_USER = process.env.DB_ADMIN_USER;
const PARLOUR_ROOT_URL = process.env.PARLOUR_ROOT_URL;

export const testUser: types.User = {
  isSignedIn: false,
  idpId: "12345",
  idp: types.IDP.GOOGLE,
  lastName: "Last",
  firstName: "Dan",
  email: "dan@smartguys.com",
  about: "smart guy",
  username: "notNull@thatsforsure.com",
  profPicUrl: "http://mypic.com/1234567",
};

export const getParlourRootDbPool = (role?: string) => {
  return poolFromUrl(PARLOUR_ROOT_URL, role);
};

export const cleanTestDb = async () => {
  logger.debug("cleanTestDb - beginning database cleanup");
  const p = await getParlourRootDbPool();
  try {
    await p.query("delete from parlour_public.users");
    await p.query("delete from parlour_public.parlour_user_join");
    await p.query("delete from parlour_public.invitation");
    await p.query("delete from parlour_public.parlour");
    await p.query("delete from parlour_private.account");
    await p.query("delete from parlour_private.login_session");
  } catch (e) {
    console.error("cleanTestDb had error:" + e);
  }
};

export const deleteTestUsers = async () => {
  let dels: Promise<QueryResult>[] = [];
  try {
    const p = getParlourRootDbPool();
    logger.debug(`deleting test users`);
    testCreatedUsers.forEach((u) => {
      dels.push(
        p.query("delete from parlour_public.users where username = $1", [
          u.username,
        ]),
        p.query(
          "delete from parlour_private.login_session where sess->>'user_id' = $1",
          [u.username]
        )
      );
    });
    dels.push(
      p.query("delete from parlour_public.users where username = $1", [
        testUser.username,
      ])
    );
    userCreationCounter = 0;
    testCreatedUsers.length = 0;
    return await Promise.all(dels);
  } catch (e) {
    console.error("error deleteTestUsers:", e);
  }
};

export const deleteTestParlours = async () => {
  const deletes: Promise<QueryResult>[] = [];
  const pool = getParlourRootDbPool();
  testParlours.forEach((p) => {
    deletes.push(
      pool.query("delete from parlour_public.parlour where uid = $1", [p.uid])
    );
  });
  testParlours.length = 0;
  return Promise.all(deletes);
};

const deleteDataById = async (id: string) => {
  console.log("deleting test data with id:" + id);
  const deletes: Promise<QueryResult>[] = [];

  const p = getParlourRootDbPool();
  deletes.push(
    p.query(
      "delete from parlour_public.users where username like '%' || $1 || '%'",
      [id]
    )
  );
  testCreatedUsers.length = 0;
  deletes.push(
    p.query(
      "delete from parlour_public.parlour where name like '%_id:' || $1 || '%'",
      [id]
    )
  );
  testParlours.length = 0;
  deletes.push(
    p.query(
      "delete from parlour_public.invitation where description like '%' || $1 || '%'",
      [id]
    )
  );
  return Promise.all(deletes);
};

export const deleteTestData = async (dataId?: string) => {
  console.log("deleting test data");
  let dels: Promise<any>[] = [];
  dels.push(deleteTestUsers());
  if (dataId) {
    dels.push(deleteDataById(dataId));
  }
  return await Promise.all(dels).catch((err) => {
    console.log("error deleting data: " + err);
  });
};

export const saveParlour = async (
  par: types.Parlour
): Promise<types.Parlour> => {
  const p = getParlourRootDbPool();
  return new Promise((resolve, reject) => {
    let params: string[] = [
      par.name,
      par.description,
      par.creator_uid,
      par.uid,
    ];
    let query = `insert into parlour_public.parlour (name, description, creator_uid, uid) 
            values ($1, $2, $3, $4) returning uid`;
    if (!par.uid) {
      query =
        "insert into parlour_public.parlour (name, description, creator_uid) values ($1, $2, $3) returning uid";
      params = [par.name, par.description, par.creator_uid];
    }
    p.query(query, params)
      .then((result) => {
        if (result.rows.length === 1) {
          par.uid = result.rows[0].uid;
          resolve(par);
        }
      })
      .catch((err) => {
        logger.error("saveParlour failed, error:" + err);
        reject("database error:" + err);
      });
  });
};

export const createInvitation = async (
  parlour: string,
  email: string,
  requires_uid: boolean = true,
  base: string = "default"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    getParlourRootDbPool()
      .query(
        "insert into parlour_public.invitation (email, parlour_uid, description, requires_uid) values ($1, $2, $3, $4) returning uid",
        [email, parlour, base, requires_uid]
      )
      .then((result) => {
        console.log("created invite, uid:" + result.rows[0]["uid"]);
        resolve(result.rows[0]["uid"]);
      })
      .catch((err) => {
        console.log("error creating invite: " + err);
        reject(err);
      });
  });
};

export const testParlours: types.Parlour[] = [];
export const createParlours = async (
  count: number = 1,
  base: string = "default",
  creatorTestUserIdx = 0,
  creatorUid?: string
) => {
  if (!creatorUid) {
    console.log(
      `creating ${count} parlours using idx ${creatorTestUserIdx}, uid ${testCreatedUsers[creatorTestUserIdx].uid}, 
      and createduser length ${testCreatedUsers.length} `
    );
    creatorUid = testCreatedUsers[creatorTestUserIdx].uid;
  }

  const inserts = [];
  for (let i = 0; i < count; i++) {
    const parlourLetter = "abcdefghijklmnopqrstuvwxyz"[i];
    const p: types.Parlour = {
      description: parlourLetter.repeat(10),
      name: parlourLetter + `_id:${base}`,
      creator_uid: creatorUid,
    };
    const pool = getParlourRootDbPool();
    inserts.push(
      pool
        .query(
          `insert into parlour_public.parlour(description, name, creator_uid) values ($1, $2, $3) 
          returning uid, name, description, creator_uid`,
          [p.description, p.name, p.creator_uid]
        )
        .then((result) => {
          if (result.rows.length == 0) {
            throw new Error("insert returned no result rows");
          }
          const p = deserializeParlour(result.rows[0]);
          testParlours.push(p);
          console.log("created parlour: " + JSON.stringify(p));
        })
        .catch((err) =>
          console.log(
            `creating parlour (${p.description}, ${p.name}, ${p.creator_uid}) failed, err: ` +
              err
          )
        )
    );
  }
  await Promise.all(inserts);
  return new Promise((resolve, reject) => {
    poolFromUrl(TEST_DATABASE_URL, DB_ADMIN_USER)
      .connect()
      .then((client) => {
        client
          .query(
            "select count(*) as count from parlour_public.parlour where name like '%_id:' || $1 || '%'",
            [base]
          )
          .then((res) => {
            logger.debug("createParlours results: " + res.rows[0]["count"]);
            resolve(parseInt(res.rows[0]["count"]));
          })
          .catch((err) => {
            console.log("error searching for createdParlours: " + err);
            reject(err);
          })
          .finally(() => client.release());
      })
      .catch((err) => {
        console.log("error connecting to pool: " + err);
        reject(err);
      });
  });
};

export let userCreationCounter = 0;
export const testCreatedUsers: types.User[] = [];

export const createUsers = async (
  count: number = 1,
  base: string = "d.jb",
  idp: types.IDP = types.IDP.GOOGLE
): Promise<number> => {
  let offset = userCreationCounter;
  for (let i = 0; i < count; i++) {
    const userLetter = "abcdefghijklmnopqrstuvwxyz"[(offset + i) % 26];
    const email = userLetter + i + "@" + base;
    const u: types.User = {
      email: email,
      isSignedIn: false,
      firstName: `${userLetter}`,
      lastName: `${userLetter}_Last`,
      username: email,
      idp: idp,
      idpId: userLetter + userLetter + base,
      about: userLetter.repeat(10),
    };
    await regUser(u)
      .then((user) => {
        testCreatedUsers.push(user);
        userCreationCounter++;
      })
      .catch((err) => {
        logger.error(`error creating user for tests: ${err}`);
      });
  }
  return new Promise((resolve, reject) => {
    poolFromUrl(TEST_DATABASE_URL, DB_ADMIN_USER)
      .connect()
      .then((client) => {
        client
          .query(
            "select count(*) as count from parlour_public.users where email like '%' || $1 || '%'",
            [base]
          )
          .then((res) => {
            logger.debug("createdUsers results: " + res.rows[0]["count"]);
            resolve(parseInt(res.rows[0]["count"]));
          })
          .catch((err) => {
            console.log("error searching for createdUsers: " + err);
            reject(err);
          })
          .finally(() => client.release());
      })
      .catch((err) => {
        console.log("error connecting to pool: " + err);
        reject(err);
      });
  });
};

// best intentions, turns out this isn't really that usable
export const createSession = async (
  user: types.User,
  exp?: Date
): Promise<string> => {
  if (!exp) {
    exp = new Date(Date.now() + 10000);
  }
  return new Promise((resolve, reject) => {
    poolFromUrl(TEST_DATABASE_URL, DB_ROOT_USER)
      .connect()
      .then((client) => {
        client
          .query(
            "insert into parlour_private.login_session(sid, sess, expire) values (parlour_public.gen_random_uuid(), $1, $2) returning sid",
            [
              `{"cookie": "testCookie", "user_id": "${user.uid}"}`,
              exp.toISOString(),
            ]
          )
          .then((res) => {
            logger.debug(
              "createSession results: " +
                res.rows.length +
                " sid: " +
                res.rows[0].sid
            );
            const sid: string = res.rows[0].sid;
            resolve(sid);
          })
          .catch((err) => {
            logger.error("error creating session:", err);
          })
          .finally(() => {
            console.log("don't worry, releasing the client...");
            client.release();
          });
      })
      .catch((err) => {
        logger.error("couldn't get pool connection, err:" + err);
        reject(err);
      });
  });
};
