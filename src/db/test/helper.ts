import * as types from "../../common/types";
import { poolFromUrl, regUser } from "../../server/parlour_db";
import { logger } from "../../common/logger";

/*
 * We need to inform jest that these files depend on changes to the database,
 * so we write a dummy file after current.sql is imported. This file has to be
 * tracked by git, otherwise `jest --watch` won't pick up changes to it...
 */
import { ts } from "./jest.watch.hack";
if (ts) {
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
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
export const DB_ANON_USER = process.env.DB_ANON_USER;
export const DB_ROOT_USER = process.env.DB_POSTGRAHILE_USER;

export const testUser: types.User = {
  isSignedIn: true,
  idpId: "12345",
  idp: types.IDP.GOOGLE,
  lastName: "Last",
  firstName: "Dan",
  email: "dan@smartguys.com",
  about: "smart guy",
  username: "notNullThatsForSure",
  profPicUrl: "http://mypic.com/1234567",
};

export const deleteTestUsers = async () => {
  logger.debug(`deleting test users from ${TEST_DATABASE_URL}`);
  try {
    const p = poolFromUrl(TEST_DATABASE_URL, DB_ROOT_USER);
    const c = await p.connect();
    const q = await c.query("delete from parlour_public.user");
    c.release();
    return q;
  } catch (e) {
    console.error("error deleteTestUsers:", e);
  }
};

export const deleteTestData = async () => {
  try {
    return deleteTestUsers();
  } catch (e) {
    console.error("unable to delete users, exception:", e);
    throw e;
  }
};

export let userCreationCounter = 0;
export const testCreatedUsers: types.User[] = [];

export const createUsers = async (
  count: number = 1,
  idp: types.IDP = types.IDP.GOOGLE
) => {
  for (let i = 0; i < count; i++) {
    const userLetter = "abcdefghijklmnopqrstuvwxyz"[i];
    const u: types.User = {
      email: `${userLetter}${i || ""}@d.b`,
      isSignedIn: false,
      firstName: `${userLetter}`,
      lastName: `${userLetter}_Last`,
      username: userLetter + userLetter,
      idp: idp,
      idpId: userLetter + userLetter,
      about: userLetter.repeat(10),
    };
    await regUser(u)
      .then((user) => {
        userCreationCounter++;
        testCreatedUsers.push(user);
      })
      .catch((err) => {
        logger.error(`error creating user for tests: ${err}`);
      });
  }
  const client = await poolFromUrl(TEST_DATABASE_URL, DB_ROOT_USER).connect();
  await client.query("select count(*) from parlour_public.user").then((res) => {
    logger.debug("createdUsers results: " + res.rows.length);
  });
  client.release();
};
