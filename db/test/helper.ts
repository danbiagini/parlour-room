// import { Pool } from "pg";
import * as types from "../../src/common/types";
import { poolFromUrl } from "../../src/server/parlour_db";

/*
 * We need to inform jest that these files depend on changes to the database,
 * so we write a dummy file after current.sql is imported. This file has to be
 * tracked by git, otherwise `jest --watch` won't pick up changes to it...
 */
// import { ts } from "./jest.watch.hack";
// if (ts) {
//   /*
//    * ... but we don't want the changes showing up under git, so we throw
//    * them away again once the tests have been triggered.
//    */
//   require("fs").writeFileSync(
//     `${__dirname}/jest.watch.hack.ts`,
//     "export const ts = null;\n"
//   );
//   /*
//    * This will trigger Jest's file watching again, but the second time
//    * `ts` will be null (as above), so:
//    *
//    *   a) it won't happen a third time, and
//    *   b) there will be no git diff, so the tests won't need to re-run
//    */
// }

export const DEBUG_LOG = (line: string) => {
  if (process.env.DEBUG_LOGGING) {
    console.log(line);
  }
};

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
  DEBUG_LOG(`deleting test users from ${TEST_DATABASE_URL}`);
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

// let userCreationCounter = 0;

// export const createUsers = async function createUsers(
//   client: PoolClient,
//   count: number = 1,
//   verified: boolean = true
// ) {
//   const users = [];
//   if (userCreationCounter > 25) {
//     throw new Error("Too many users created!");
//   }
//   for (let i = 0; i < count; i++) {
//     const userLetter = "abcdefghijklmnopqrstuvwxyz"[userCreationCounter];
//     userCreationCounter++;
//     const email = `${userLetter}${i || ""}@b.c`;
//     const user: types.User = (
//       await client.query(
//         `SELECT * FROM app_private.really_create_user(
//         username := $1,
// 		email := $2,
// 		last_name := $3,
//         first_name := $4,
// 		about := $5
//       )`,
//         [`testuser_${userLetter}`, email, verified, `User ${userLetter}`, null]
//       )
//     ).rows[0];
//     expect(user.idpId).not.toBeNull();
//     user.email = email;
//     users.push(user);
//   }
//   return users;
// };
