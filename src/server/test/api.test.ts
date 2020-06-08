import { app } from "../main";
import { cleanPools } from "../parlour_db";
import {
  createUsers,
  deleteTestData,
  testUser,
  testCreatedUsers,
  userCreationCounter,
} from "../../db/test/helper";
import { agent as request } from "supertest";
import { OAuth2Client, LoginTicket, TokenPayload } from "google-auth-library";

const mockedVerifyIdToken = jest.fn();
const mockedGetPayload = jest.fn();

beforeAll(async () => {
  await deleteTestData();
  await createUsers(10);
});

afterAll(async () => {
  await cleanPools();
});

beforeEach(() => {
  mockedVerifyIdToken.mockClear();
  mockedGetPayload.mockClear();
});

const validToken: TokenPayload = {
  sub: testUser.idpId,
  iss: "accounts.google.com",
  aud: "",
  exp: Date.now() + 600,
  hd: "google.com",
  iat: Date.now() - 600,
};

describe("Auth APIs", () => {
  OAuth2Client.prototype.verifyIdToken = mockedVerifyIdToken;
  LoginTicket.prototype.getPayload = mockedGetPayload;

  it("returns 401 when no token received", async () => {
    const res = await request(app).get("/api/auth/google");
    expect(res.status).toBe(401);
    expect(res.body).toEqual("no auth code present");
  });

  it("returns 401 on garbage token", async () => {
    // OAuth2Client.prototype.verifyIdToken = mockedVerifyIdToken;
    mockedVerifyIdToken.mockRejectedValueOnce(
      Error("Wrong number of segments in token")
    );
    const res = await request(app).get("/api/auth/google?code=12345679");
    expect(res.status).toBe(401);
    expect(res.body).toEqual("code invalid");
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 401 on expired token", async () => {
    mockedVerifyIdToken.mockRejectedValueOnce(Error("Token used too late,"));
    const res = await request(app).get(
      "/api/auth/google?code=thisTokenIsSooooOld"
    );
    expect(res.status).toBe(401);
    expect(res.body).toEqual("Token expired");
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 403 on missing user", async () => {
    mockedGetPayload.mockReturnValueOnce(validToken);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);

    const res = await request(app).get("/api/auth/google?code=mocksAsValid");
    expect(res.status).toBe(403);
    expect(res.body).toEqual("User not found");
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });

  it("returns 200 on valid user", async () => {
    console.log(
      "created users:" +
        userCreationCounter +
        ", user 1:" +
        JSON.stringify(testCreatedUsers[0])
    );
    const signedInUser = testCreatedUsers[0];
    signedInUser.isSignedIn = true;
    validToken["sub"] = signedInUser.idpId;
    mockedGetPayload.mockReturnValueOnce(validToken);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);
    const res = await request(app).get("/api/auth/google?code=mocksAsValid");
    expect(res.status).toBe(200);

    expect(res.body).toMatchObject(signedInUser);
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
  });
});
