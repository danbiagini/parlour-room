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
};

describe("Auth login API", () => {
  it("returns 404 when no idp provided", async () => {
    const res = await request(app).get("/api/auth/login");
    expect(res.status).toBe(404);
  });

  it("returns 400 when unsupported idp provided", async () => {
    const res = await request(app).get("/api/auth/coolauth.com/login");
    expect(res.status).toBe(400);
    expect(res.body).toEqual("Unsupported IDP");
  });

  it("returns 401 when no token received", async () => {
    const res = await request(app).get("/api/auth/google.com/login");
    expect(res.status).toBe(401);
    expect(res.body).toEqual("no auth code present");
  });

  it("returns 401 on garbage token", async () => {
    mockedVerifyIdToken.mockRejectedValueOnce(
      Error("Wrong number of segments in token")
    );
    const res = await request(app).get(
      "/api/auth/google.com/login?code=12345679"
    );
    expect(res.status).toBe(401);
    expect(res.body).toEqual("code invalid");
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 401 on expired token", async () => {
    mockedVerifyIdToken.mockRejectedValueOnce(Error("Token used too late,"));
    const res = await request(app).get(
      "/api/auth/google.com/login?code=thisTokenIsSooooOld"
    );
    expect(res.status).toBe(401);
    expect(res.body).toEqual("Token expired");
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
    expect(res.body).toEqual("User not found");
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
    const res = await request(app).get(
      "/api/auth/google.com/login?code=mocksAsValid"
    );
    expect(res.status).toBe(200);

    expect(res.body).toMatchObject(signedInUser);
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
    const res = await request(app).get(
      "/api/auth/google.com/regisger?code=123456"
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when unsupported idp provided", async () => {
    const res = await request(app).post("/api/auth/coolauth.com/register");
    expect(res.status).toBe(400);
    expect(res.body).toEqual("Unsupported IDP");
  });

  it("returns 401 when no token received", async () => {
    const res = await request(app).post("/api/auth/google.com/register");
    expect(res.status).toBe(401);
    expect(res.body).toEqual("no auth code present");
  });

  it("returns 401 on garbage token", async () => {
    mockedVerifyIdToken.mockRejectedValueOnce(
      Error("Wrong number of segments in token")
    );
    const res = await request(app)
      .post("/api/auth/google.com/register?code=12345679")
      .type("application/json");
    expect(res.status).toBe(401);
    expect(res.body).toEqual("code invalid");
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 415 on post with no json Content-Type ", async () => {
    const res = await request(app).post(
      "/api/auth/google.com/register?code=12345679"
    );
    expect(res.status).toBe(415);
  });

  it("returns 401 on expired token", async () => {
    mockedVerifyIdToken.mockRejectedValueOnce(Error("Token used too late,"));
    const res = await request(app)
      .post("/api/auth/google.com/register?code=this.TokenIs.SooooOld")
      .type("application/json");
    expect(res.status).toBe(401);
    expect(res.body).toEqual("Token expired");
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 409 on existing user", async () => {
    const signedInUser = testCreatedUsers[0];
    signedInUser.isSignedIn = true;
    validToken["sub"] = signedInUser.idpId;
    mockedGetPayload.mockReturnValueOnce(validToken);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);
    const res = await request(app)
      .post("/api/auth/google.com/register?code=mocksAsValid")
      .send(signedInUser)
      .type("application/json");
    expect(res.status).toBe(409);
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 200 on valid user", async () => {
    mockedGetPayload.mockResolvedValueOnce(validToken);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);

    const res = await request(app)
      .post("/api/auth/google.com/register?code=mocksAsValid")
      .send(testUser)
      .type("application/json");
    expect(res.status).toBe(200);
    expect(res.type).toBe("application/json");
    testUser.isSignedIn = false;
    expect(res.body).toMatchObject(testUser);
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });
});
