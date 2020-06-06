import { User, IDP } from "../../common/types";
import { loginUser, poolFromUrl, cleanPools } from "../../server/parlour_db";
import { testUser, TEST_DATABASE_URL, deleteTestData, regUser } from "./helper";

afterAll(async () => {
  return cleanPools();
});

beforeAll(async () => {
  await deleteTestData();
});

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

  // TODO: fix - depends on user created in previous test
  it("can login new user", async () => {
    let u1: User = Object.assign({}, testUser);
    expect.assertions(1);
    await expect(loginUser(IDP.GOOGLE, u1.idpId)).resolves.toEqual(u1);
  });

  it("login fails on invalid idp_id new user", async () => {
    expect.assertions(1);
    await expect(loginUser(IDP.GOOGLE, "DoesntExist")).rejects.toThrow(
      "idp_id not found"
    );
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
