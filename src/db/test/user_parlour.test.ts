// eslint-disable-next-line no-debugger
debugger;

import { User, IDP } from "../../common/types";
import {
  loginUser,
  poolFromUrl,
  cleanPools,
  regUser,
  getParlourDbPool,
  getParlourRootDbPool,
} from "../../server/parlour_db";
import {
  testUser,
  TEST_DATABASE_URL,
  deleteTestData,
  createUsers,
  testCreatedUsers,
  createParlours,
} from "./helper";

const testId = "user-parlour.test";
console.log("testing with testId:" + testId);

afterAll(async (done) => {
  // await deleteTestData(testId);
  await cleanPools();
  done();
});

beforeEach(async (done) => {
  await createUsers(1, testId, IDP.GOOGLE);
  done();
});

afterEach(async (done) => {
  await deleteTestData(testId);
  done();
});

beforeAll(async (done) => {
  await deleteTestData(testId);
  done();
});

describe("utility functions", () => {
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
  it("anon cannot manually insert a user", async (done) => {
    const client = await poolFromUrl(
      TEST_DATABASE_URL,
      process.env.DB_ANON_USER
    ).connect();
    await expect(
      client.query(
        `insert into parlour_public.users (username, first_name, about) 
		values ('test123@${testId}', 'Test', 'Once upon a test')`
      )
    ).rejects.toThrow("permission denied for table user");
    client.release();
    done();
  });

  it("anon cannot manually insert a parlour", async (done) => {
    expect.hasAssertions();
    await poolFromUrl(TEST_DATABASE_URL, process.env.DB_ANON_USER)
      .query(
        `insert into parlour_public.parlour (name, creator_uid, description) 
		values ('test123@${testId}', '${testCreatedUsers[0].uid}', 'Once upon a test')`
      )
      .catch((err) => {
        expect(err).toEqual(new Error("permission denied for table parlour"));
      });
    done();
  });

  it("signedin_user cannot manually insert a user", async (done) => {
    const client = await poolFromUrl(
      TEST_DATABASE_URL,
      process.env.DB_SIGNEDIN_USER
    ).connect();
    await expect(
      client.query(
        `insert into parlour_public.users (username, first_name, about) 
		values ('test123@${testId}', 'Test', 'Once upon a test')`
      )
    ).rejects.toThrow("permission denied for table user");
    client.release();
    done();
  });

  it("signedin_user cannot manually insert a parlour", async (done) => {
    expect.hasAssertions();
    await poolFromUrl(TEST_DATABASE_URL, process.env.DB_SIGNEDIN_USER)
      .query(
        `insert into parlour_public.parlour (name, creator_uid, description) 
		values ('test123@${testId}', '${testCreatedUsers[0].uid}', 'Once upon a test')`
      )
      .catch((err) => {
        expect(err).toEqual(new Error("permission denied for table parlour"));
      });
    done();
  });

  it("postgraphile cannot manually insert a user", async (done) => {
    expect.hasAssertions();
    const p = getParlourDbPool();
    await expect(
      p.query(
        `insert into parlour_public.users (username, first_name, about) 
		          values ('test123@${testId}', 'Test', 'Once upon a test')`
      )
    ).rejects.toThrow("permission denied for table user");
    done();
  });

  it("postgraphile cannot manually insert a parlour", async (done) => {
    expect.hasAssertions();
    await getParlourDbPool()
      .query(
        `insert into parlour_public.parlour (name, creator_uid, description) 
		values ('test123@${testId}', '${testCreatedUsers[0].uid}', 'Once upon a test')`
      )
      .catch((err) => {
        expect(err).toEqual(new Error("permission denied for table parlour"));
      });
    done();
  });

  it("admin can manually insert a user", async (done) => {
    expect.hasAssertions();
    const p = getParlourRootDbPool(process.env.DB_ADMIN_USER);
    await p
      .query(
        `insert into parlour_public.users (username, first_name, about) 
		          values ('admin-insert@${testId}', 'Test', 'Once upon a test')`
      )
      .then((res) => {
        expect(res.rowCount).toBe(1);
      });
    done();
  });

  it("admin can manually insert a parlour", async (done) => {
    expect.hasAssertions();
    const p = getParlourRootDbPool(process.env.DB_ADMIN_USER);
    await p
      .query(
        `insert into parlour_public.parlour (name, creator_uid, description) 
		values ('test123@${testId}', '${testCreatedUsers[0].uid}', 'Once upon a test')`
      )
      .then((res) => {
        expect(res.rowCount).toBe(1);
      });
    done();
  });

  it("postgraphile can login new user", async (done) => {
    let u1 = testCreatedUsers[0];
    let u2: User = Object.assign({}, u1);
    u2.isSignedIn = true;
    expect.assertions(1);
    await expect(loginUser(IDP.GOOGLE, u1.idpId)).resolves.toMatchObject(u2);
    done();
  });

  it("login fails on invalid idp_id new user", async () => {
    expect.assertions(1);
    await expect(loginUser(IDP.GOOGLE, "DoesntExist")).rejects.toThrow(
      "idp_id not found"
    );
  });

  it("user can query for their parlours", async (done) => {
    await createUsers(2, testId);
    await createParlours(2, testId, 1);
    await createParlours(2, testId, 0);

    const result = await poolFromUrl(
      TEST_DATABASE_URL,
      process.env.DB_SIGNEDIN_USER,
      testCreatedUsers[1].uid
    ).query(
      `select pu.* from parlour_public.parlour_user as pu inner join parlour_public.parlour as p
        on p.uid = pu.parlour_uid`
    );
    expect(result.rows.length).toEqual(2);
    expect(result.rows[0]["user_uid"]).toEqual(testCreatedUsers[1].uid);
    expect(result.rows[1]["user_uid"]).toEqual(testCreatedUsers[1].uid);
    done();
  });

  it("can assume admin role", async (done) => {
    const pool = poolFromUrl(TEST_DATABASE_URL, process.env.DB_ADMIN_USER);
    expect.hasAssertions();
    await pool.query("show role").then((res) => {
      expect(res.rows[0].role).toEqual("parlour_admin");
    });
    done();
  });

  it("admin can query for all parlours", async (done) => {
    const userCount = await createUsers(2, testId);
    expect(userCount).toEqual(3); // 1 user is created in beforeEach

    await createParlours(2, testId, 1);

    const parlourCount = await createParlours(1, testId, 0);
    expect(parlourCount).toBe(3);

    const result = await poolFromUrl(
      TEST_DATABASE_URL,
      process.env.DB_ADMIN_USER
    ).query(
      `select pu.* from parlour_public.parlour_user as pu inner join parlour_public.parlour as p
        on p.uid = pu.parlour_uid where p.name like '%${testId}%' 
        order by pu.created_at desc`
    );
    expect(result.rows.length).toEqual(3);
    expect(result.rows[0]["user_uid"]).toEqual(testCreatedUsers[0].uid);
    expect(result.rows[1]["user_uid"]).toEqual(testCreatedUsers[1].uid);
    expect(result.rows[2]["user_uid"]).toEqual(testCreatedUsers[1].uid);
    done();
  });
});

describe("register new user", () => {
  it("error on new user already exists", async () => {
    // createUsers(1, IDP.GOOGLE);
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
    u1.username = "success-" + testUser.username + `-${testId}`;
    expect.assertions(1);
    await expect(regUser(u1)).resolves.toMatchObject(u1);
    testCreatedUsers.push(u1);
  });
});
