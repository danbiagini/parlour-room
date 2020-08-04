/* eslint-disable no-debugger */
import { app } from "../main";
import { cleanPools } from "../parlour_db";
import {
  createUsers,
  deleteTestData,
  testUser,
  testCreatedUsers,
  cleanTestDb,
} from "../../db/test/helper";
import { agent as request } from "supertest";
import { OAuth2Client, LoginTicket, TokenPayload } from "google-auth-library";

const mockedVerifyIdToken = jest.fn();
const mockedGetPayload = jest.fn();

beforeAll(async () => {
  jest
    .spyOn(OAuth2Client.prototype, "verifyIdToken")
    .mockImplementation(mockedVerifyIdToken);
  jest
    .spyOn(LoginTicket.prototype, "getPayload")
    .mockImplementation(mockedGetPayload);
  await cleanTestDb();
  await createUsers(10);
});

afterAll(async () => {
  await deleteTestData();
  await cleanPools();
  jest.restoreAllMocks();
});

beforeEach(() => {
  mockedVerifyIdToken.mockClear();
  mockedGetPayload.mockClear();
});

afterEach(() => {
  validToken.sub = testUser.idpId;
});

const validToken: TokenPayload = {
  sub: testUser.idpId,
  iss: "accounts.google.com",
  aud: "",
  exp: Date.now() + 600,
  iat: Date.now() - 600,
  email_verified: true,
  email: testUser.email,
};

describe("Auth login API", () => {
  it("returns 404 when no idp provided", (done) => {
    request(app)
      .get("/api/auth/login")
      .set("Accept", "application/json")
      .expect(404, done);
  });

  it("returns 400 when unsupported idp provided", (done) => {
    request(app)
      .get("/api/auth/coolauth.com/login")
      .set("Accept", "application/json")
      .expect("Content-Type", "application/json; charset=utf-8")
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      })
      .expect(400, { message: "Unsupported IDP" }, done);
  });

  it("returns 401 when no token received", (done) => {
    request(app)
      .get("/api/auth/google.com/login")
      .expect("Content-Type", "application/json; charset=utf-8")
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      })
      .expect(401, { message: "no auth code present" }, done);
  });

  it("returns 401 on mal-formatted auth hdrs", (done) => {
    request(app)
      .get("/api/auth/google.com/login")
      .set("Authorization", "non-sense")
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      })
      .expect(401, { message: "no auth code present" }, done);
  });

  it("returns 401 on garbage token", async () => {
    mockedVerifyIdToken.mockRejectedValueOnce(
      Error("Wrong number of segments in token")
    );
    await request(app)
      .get("/api/auth/google.com/login?code=12345679")
      .expect(401, { message: "code invalid" })
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      });
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 401 on expired token", async () => {
    mockedVerifyIdToken.mockRejectedValueOnce(Error("Token used too late,"));
    const res = await request(app).get(
      "/api/auth/google.com/login?code=thisTokenIsSooooOld"
    );
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token expired" });
    expect(res.header).not.toHaveProperty("set-cookie");
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 403 on missing user", async () => {
    mockedGetPayload.mockReturnValueOnce(validToken);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);

    const res = await request(app).get(
      "/api/auth/google.com/login?code=mocksAsValid"
    );
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "User not found" });
    expect(res.header).not.toHaveProperty("set-cookie");
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
    expect(mockedGetPayload.mock.calls).toHaveLength(1);
  });

  it("returns 200 on valid user", async () => {
    const signedInUser = testCreatedUsers[0];
    signedInUser.isSignedIn = true;
    validToken["sub"] = signedInUser.idpId;
    mockedGetPayload.mockReturnValueOnce(validToken);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);

    await request(app)
      .get("/api/auth/google.com/login?code=mocksAsValid")
      .expect(200, signedInUser)
      .expect(
        "set-cookie",
        /parlourSession=.*; Path=\/; Expires=.*; HttpOnly; SameSite=Strict/
      );
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
    expect(mockedGetPayload.mock.calls).toHaveLength(1);
  });

  it("returns 200 on valid user with Authorization hdr", async () => {
    const signedInUser = testCreatedUsers[0];
    signedInUser.isSignedIn = true;
    validToken["sub"] = signedInUser.idpId;
    mockedGetPayload.mockReturnValueOnce(validToken);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);
    await request(app)
      .get("/api/auth/google.com/login")
      .set("Authorization", "Bearer mocksAsValid")
      .expect(200, signedInUser)
      .expect(
        "set-cookie",
        /parlourSession=.*; Path=\/; Expires=.*; HttpOnly; SameSite=Strict/
      );
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
    expect(mockedGetPayload.mock.calls).toHaveLength(1);
  });
});

describe("Auth register API", () => {
  it("returns 404 when no idp provided", async () => {
    const res = await request(app).get("/api/auth/register");
    expect(res.status).toBe(404);
  });

  it("returns 404 on unsupported method GET", async () => {
    await request(app)
      .get("/api/auth/google.com/regisger?code=123456")
      .expect(404)
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      });
  });

  it("returns 400 when unsupported idp provided", async () => {
    await request(app)
      .post("/api/auth/coolauth.com/register")
      .expect(400, { message: "Unsupported IDP" })
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      });
  });

  it("returns 401 when no token received", async () => {
    await request(app)
      .post("/api/auth/google.com/register")
      .expect(401, { message: "no auth code present" })
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      });
  });

  it("returns 401 on mal-formatted auth hdr 'non-sense'", async () => {
    await request(app)
      .post("/api/auth/google.com/register")
      .set("Authorization", "non-sense")
      .expect(401, { message: "no auth code present" })
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      });
  });

  it("returns 401 on mal-formatted auth hdr 'non sense'", async () => {
    await request(app)
      .post("/api/auth/google.com/register")
      .set("Authorization", "non sense")
      .expect(401, { message: "no auth code present" })
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      });
  });

  it("returns 401 on garbage token", async () => {
    mockedVerifyIdToken.mockRejectedValueOnce(
      Error("Wrong number of segments in token")
    );
    await request(app)
      .post("/api/auth/google.com/register?code=12345679")
      .type("application/json")
      .expect(401, { message: "code invalid" })
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      });
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 409 on email not verified", async () => {
    const unverifiedEmail = Object.assign({}, validToken);
    unverifiedEmail["email_verified"] = false;
    mockedGetPayload.mockResolvedValueOnce(unverifiedEmail);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);

    await request(app)
      .post("/api/auth/google.com/register?code=mocksAsEmailNotVerified")
      .send(testUser)
      .type("application/json")
      .expect(409, { message: "Error: email not verified" })
      .expect("Content-Type", "application/json; charset=utf-8")
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      });

    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 409 on email doesn't match", async () => {
    mockedGetPayload.mockResolvedValueOnce(validToken);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);

    const diffEmail = Object.assign({}, testUser);
    diffEmail.email = "notTheSameEmail@this.fails.com";
    await request(app)
      .post("/api/auth/google.com/register?code=mocksAsEmailNotVerified")
      .send(diffEmail)
      .type("application/json")
      .expect(409, {
        message: "Error: user email doesn't match token",
      })
      .expect("Content-Type", "application/json; charset=utf-8")
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      });
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 415 on post with no json Content-Type ", async () => {
    await request(app)
      .post("/api/auth/google.com/register?code=12345679")
      .expect(415, { message: "Invalid content type" })
      .expect("Content-Type", "application/json; charset=utf-8")
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      });
  });

  it("returns 401 on expired token", async () => {
    mockedVerifyIdToken.mockRejectedValueOnce(Error("Token used too late,"));
    await request(app)
      .post("/api/auth/google.com/register?code=this.TokenIs.SooooOld")
      .type("application/json")
      .expect(401, { message: "Token expired" })
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      });
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 409 on existing user", async () => {
    const signedInUser = testCreatedUsers[0];
    signedInUser.isSignedIn = false;
    const dup = Object.assign({}, validToken);
    dup["email"] = signedInUser.email;
    dup["sub"] = signedInUser.idpId;
    mockedGetPayload.mockReturnValueOnce(dup);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);

    await request(app)
      .post("/api/auth/google.com/register?code=mocksAsValid")
      .send(signedInUser)
      .type("application/json")
      .expect(409, { message: "User already exists" })
      .expect((res) => {
        expect(res.header).not.toHaveProperty("set-cookie");
      });
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 200 on valid user", async () => {
    mockedGetPayload.mockResolvedValueOnce(validToken);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);

    await request(app)
      .post("/api/auth/google.com/register?code=mocksAsValid")
      .send(testUser)
      .type("application/json")
      .expect("Content-Type", "application/json; charset=utf-8")
      .expect((res) => {
        testUser.isSignedIn = true;
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject(testUser);
      })
      .expect(
        "set-cookie",
        /parlourSession=.*; Path=\/; Expires=.*; HttpOnly; SameSite=Strict/
      );
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });
});
