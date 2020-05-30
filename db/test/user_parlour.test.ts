// import { Client } from "pg";
import { User } from "../../src/store/types";
import {
  testUser,
  poolFromUrl,
  TEST_DATABASE_URL,
  cleanPools,
  deleteTestData,
} from "./helper";

afterAll(async () => {
  return cleanPools();
});

beforeAll(async () => {
  await deleteTestData();
});

async function regUser(user: User) {
  const client = await poolFromUrl(
    TEST_DATABASE_URL,
    process.env.DB_ANON_USER
  ).connect();

  try {
    await client.query("BEGIN;");
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
    expect(result.rowCount).toBe(1);
    const createdUser: User = {
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
      username: result.rows[0].username,
      email: result.rows[0].email,
      about: result.rows[0].about,
      profPicUrl: result.rows[0].prof_img_url,
      isSignedIn: false,
    };
    expect(createdUser.uid).not.toBeNull();
    await client.query("END;");
    client.release();

    return createdUser;
  } catch (e) {
    await client.query("ROLLBACK");
    client.release();
    throw e;
  }
}
// username text,
// last_name text,
// first_name text,
// email text,
// about text,
// idp parlour_public.identityProvider,
// external_id text

// const client = new Client({
//   connectionString: process.env.TEST_DATABASE_URL,
//   statement_timeout: 5000,
//   query_timeout: 5000,
// });

describe("grant restrictions on mutations ", () => {
  it("cannot manually insert a user", async () => {
    const client = await poolFromUrl(
      TEST_DATABASE_URL,
      process.env.DB_ANON_USER
    ).connect();
    await expect(
      client.query(
        `insert into parlour_public.user (username, first_name, about) 
		values ('test123', 'Test', 'Once upon a test')`
      )
    ).rejects.toThrow("permission denied for table user");
    client.release();
  });

  it("can check the time", async () => {
    const client = await poolFromUrl(
      TEST_DATABASE_URL,
      process.env.DB_ANON_USER
    ).connect();
    expect((await client.query("select now()")).rowCount).toEqual(1);
    client.release();
  });

  it("can register a new user", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    expect.assertions(3);
    await expect(regUser(u1)).resolves.toMatchInlineSnapshot(`
            Object {
              "about": "smart guy",
              "email": "dan@smartguys.com",
              "firstName": "Dan",
              "isSignedIn": false,
              "lastName": "Last",
              "profPicUrl": "http://mypic.com/1234567",
              "username": "notNullThatsForSure",
            }
          `);
  });

  it("error on new user -- first_name > 80", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    u1.firstName = "ThisIsLong".repeat(8);
    expect.assertions(1);
    await expect(regUser(u1)).rejects.toThrow(
      'new row for relation "user" violates check constraint "user_first_name_check"'
    );
  });

  it("error on new user -- last_name > 80", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    u1.lastName = "ThisIsLong".repeat(8);
    expect.assertions(1);
    await expect(regUser(u1)).rejects.toThrow(
      'new row for relation "user" violates check constraint "user_last_name_check"'
    );
  });

  it("error on new user -- email > 80", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    u1.email = "ThisIsLong".repeat(8);
    expect.assertions(1);
    await expect(regUser(u1)).rejects.toThrow(
      'new row for relation "user" violates check constraint "user_email_check"'
    );
  });

  it("error on new user -- about > 2k", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    u1.about = "ThisIsLong".repeat(2048 / 10 + 1);
    expect.assertions(1);
    await expect(regUser(u1)).rejects.toThrow(
      'new row for relation "user" violates check constraint "user_about_check"'
    );
  });

  it("error on long URL on profileImg", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    u1.profPicUrl = "ThisIsLong".repeat(2048 / 10 + 1);
    expect.assertions(1);
    await expect(regUser(u1)).rejects.toThrow(
      'new row for relation "user" violates check constraint "user_prof_img_url_check"'
    );
  });
});
