import { User, IDP } from "../../common/types";
import {
  loginUser,
  poolFromUrl,
  cleanPools,
  regUser,
} from "../../server/parlour_db";
import {
  testUser,
  TEST_DATABASE_URL,
  deleteTestData,
  createUsers,
  testCreatedUsers,
  cleanTestDb,
} from "./helper";

afterAll(async () => {
  await deleteTestData();
  await cleanPools();
});

beforeAll(async () => {
  await cleanTestDb();
  await createUsers(1, IDP.GOOGLE);
});

describe("utility functionds", () => {
  it("can coerce pgtime w/ no time zone to Date", async (done) => {
    expect.hasAssertions();
    poolFromUrl(TEST_DATABASE_URL, process.env.DB_ANON_USER).query(
      "select '2020-08-07'::timestamp as stamp",
      (err, result) => {
        if (err) {
          console.log("sql error: " + err);
          expect(err).toBeFalsy();
          return done();
        }
        expect(result.rows.length).toEqual(1);
        expect(result.rows[0]["stamp"]).toMatchObject(
          new Date("2020-08-07T00:00:00")
        );
        done();
      }
    );
  });

  it("can coerce pgtime w/ time zone to Date", async (done) => {
    expect.hasAssertions();
    poolFromUrl(TEST_DATABASE_URL, process.env.DB_ANON_USER).query(
      "select '2020-08-07'::timestamp at time zone 'utc' as stamp",
      (err, result) => {
        if (err) {
          console.log("sql error: " + err);
          expect(err).toBeFalsy();
          return done();
        }
        expect(result.rowCount).toEqual(1);
        expect(result.rows[0]["stamp"]).toMatchObject(
          new Date("2020-08-07 00:00:00-00:00")
        );
        done();
      }
    );
  });
});

describe("grant restrictions on mutations ", () => {
  it("cannot manually insert a user", async () => {
    const client = await poolFromUrl(
      TEST_DATABASE_URL,
      process.env.DB_ANON_USER
    ).connect();
    await expect(
      client.query(
        `insert into parlour_public.users (username, first_name, about) 
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

  it("can login new user", async () => {
    let u1 = testCreatedUsers[0];
    let u2: User = Object.assign({}, u1);
    u2.isSignedIn = true;
    expect.assertions(1);
    await expect(loginUser(IDP.GOOGLE, u1.idpId)).resolves.toMatchObject(u2);
  });

  it("login fails on invalid idp_id new user", async () => {
    expect.assertions(1);
    await expect(loginUser(IDP.GOOGLE, "DoesntExist")).rejects.toThrow(
      "idp_id not found"
    );
  });
});

describe("register new user", () => {
  it("error on new user already exists", async () => {
    createUsers(1, IDP.GOOGLE);
    let u1 = testCreatedUsers[0];
    expect.assertions(1);
    await expect(regUser(u1)).rejects.toThrow(
      'duplicate key value violates unique constraint "users_username_key"'
    );
  });

  it("error on new user -- first_name > 80", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    u1.firstName = "ThisIsLong".repeat(8);
    expect.assertions(1);
    await expect(regUser(u1)).rejects.toThrow(
      'new row for relation "users" violates check constraint "users_first_name_check"'
    );
  });

  it("error on new user -- last_name > 80", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    u1.lastName = "ThisIsLong".repeat(8);
    expect.assertions(1);
    await expect(regUser(u1)).rejects.toThrow(
      'new row for relation "users" violates check constraint "users_last_name_check"'
    );
  });

  it("error on new user -- email > 320", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    u1.email = "ThisIsLong".repeat(32) + "@smarty.com";
    expect.assertions(1);
    await expect(regUser(u1)).rejects.toThrow(
      'new row for relation "users" violates check constraint "users_email_check"'
    );
  });

  it("error on new user -- email invalid format", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    u1.email = "ThisIsNotAnEmail";
    expect.assertions(1);
    await expect(regUser(u1)).rejects.toThrow(
      'new row for relation "users" violates check constraint "users_email_check"'
    );
  });
  it("error on new user -- about > 2k", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    u1.about = "ThisIsLong".repeat(2048 / 10 + 1);
    expect.assertions(1);
    await expect(regUser(u1)).rejects.toThrow(
      'new row for relation "users" violates check constraint "users_about_check"'
    );
  });

  it("error on long URL on profileImg", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    u1.profPicUrl = "ThisIsLong".repeat(2048 / 10 + 1);
    expect.assertions(1);
    await expect(regUser(u1)).rejects.toThrow(
      'new row for relation "users" violates check constraint "users_prof_img_url_check"'
    );
  });

  it("can register a new user", async () => {
    let u1: User = Object.assign({}, testUser);
    u1.isSignedIn = false;
    u1.username = "success-" + testUser.username;
    expect.assertions(1);
    await expect(regUser(u1)).resolves.toMatchObject(u1);
    testCreatedUsers.push(u1);
  });
});
