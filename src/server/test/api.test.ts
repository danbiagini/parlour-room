/* eslint-disable no-debugger */
import { app } from "../main";
import { cleanPools } from "../parlour_db";
import {
  ParlourSession,
  findSession,
  MAXIMUM_SESSION_DURATION_IN_MILLISECONDS,
  nullSession,
} from "../sessions";
import {
  createUsers,
  deleteTestData,
  testUser,
  testCreatedUsers,
} from "../../db/test/helper";

import {
  mockedVerifyIdToken,
  mockedGetPayload,
  validToken,
  login,
  cookieJar,
} from "./api_helper";
import { agent as request } from "supertest";
import { OAuth2Client, LoginTicket, TokenPayload } from "google-auth-library";
import * as cookie from "cookie";
import cookieParser from "cookie-parser";
import { User } from "../../common/types";
import path from "path";

const testId = path.basename(__filename);
let testUserToken: TokenPayload = validToken(testUser);

beforeAll(async () => {
  jest
    .spyOn(OAuth2Client.prototype, "verifyIdToken")
    .mockImplementation(mockedVerifyIdToken);
  jest
    .spyOn(LoginTicket.prototype, "getPayload")
    .mockImplementation(mockedGetPayload);
  // await cleanTestDb();
  await deleteTestData(testId);
  await createUsers(10, testId);
});

afterAll(async () => {
  await deleteTestData(testId);
  await cleanPools();
  jest.restoreAllMocks();
});

beforeEach(() => {
  mockedVerifyIdToken.mockClear();
  mockedGetPayload.mockClear();
});

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
    mockedGetPayload.mockReturnValueOnce(testUserToken);
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
    let signedInUser: User;
    signedInUser = Object.assign({}, testCreatedUsers[0]);
    signedInUser.isSignedIn = true;
    mockedGetPayload.mockReturnValueOnce(validToken(signedInUser));
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);

    let sid: string = undefined;
    await request(app)
      .get("/api/auth/google.com/login?code=mocksAsValid")
      .expect(200)
      .expect(
        "set-cookie",
        /parlourSession=.*; Path=\/; Expires=.*; HttpOnly; SameSite=Strict/
      )
      .expect((res) => {
        res.body.lastSignin = new Date(res.body.lastSignin);
        expect(res.body).toMatchObject(signedInUser);
        sid =
          cookieParser.signedCookie(
            cookie.parse(res.header["set-cookie"][0]).parlourSession,
            process.env.SESSION_SECRET
          ) || "not found";
      });
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
    expect(mockedGetPayload.mock.calls).toHaveLength(1);

    const s: ParlourSession = await findSession(sid);
    const expires = new Date(s.expires);
    const target = new Date(
      Date.now() + MAXIMUM_SESSION_DURATION_IN_MILLISECONDS
    );
    expect(expires.valueOf()).toBeWithin(
      target.valueOf() - 1000,
      target.valueOf() + 1000
    );
    expect(expires.valueOf()).toBeGreaterThanOrEqual(target.valueOf());
    expect(s.sess.user_id).toEqual(signedInUser.uid);
  });

  it("returns 200 on valid user with Authorization hdr", async () => {
    const signedInUser = testCreatedUsers[0];
    signedInUser.isSignedIn = true;
    // validToken["sub"] = signedInUser.idpId;
    mockedGetPayload.mockReturnValueOnce(validToken(signedInUser));
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);
    let sid: string = undefined;

    await request(app)
      .get("/api/auth/google.com/login")
      .set("Authorization", "Bearer mocksAsValid")
      .expect(200)
      .expect(
        "set-cookie",
        /parlourSession=.*; Path=\/; Expires=.*; HttpOnly; SameSite=Strict/
      )
      .expect((res) => {
        res.body.lastSignin = new Date(res.body.lastSignin);
        let localCopy: User = {
          isSignedIn: false,
        };
        Object.assign(localCopy, signedInUser);
        delete localCopy.lastSignin;
        expect(res.body).toMatchObject(localCopy);
        sid =
          cookieParser.signedCookie(
            cookie.parse(res.header["set-cookie"][0]).parlourSession,
            process.env.SESSION_SECRET
          ) || "not found";
      });
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);
    expect(mockedGetPayload.mock.calls).toHaveLength(1);

    const s: ParlourSession = await findSession(sid);
    const expires = new Date(s.expires);
    const target = new Date(
      Date.now() + MAXIMUM_SESSION_DURATION_IN_MILLISECONDS
    );
    expect(expires.valueOf()).toBeGreaterThanOrEqual(target.valueOf());
    expect(s.sess.user_id).toEqual(signedInUser.uid);
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
    const unverifiedEmail = Object.assign({}, testUserToken);
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
    mockedGetPayload.mockResolvedValueOnce(testUserToken);
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
    const dup = Object.assign({}, testUserToken);
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
    mockedGetPayload.mockResolvedValueOnce(testUserToken);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);

    let sid: string = undefined;
    let uid: string = undefined;
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
      )
      .expect((res) => {
        sid =
          cookieParser.signedCookie(
            cookie.parse(res.header["set-cookie"][0]).parlourSession,
            process.env.SESSION_SECRET
          ) || "not found";
        uid = res.body.uid;
      });
    expect(mockedVerifyIdToken.mock.calls).toHaveLength(1);

    const s: ParlourSession = await findSession(sid);
    const expires = new Date(s.expires);
    const target = new Date(
      Date.now() + MAXIMUM_SESSION_DURATION_IN_MILLISECONDS
    );
    expect(expires.valueOf()).toBeWithin(
      target.valueOf() - 1000,
      target.valueOf() + 1000
    );
    expect(s.sess.user_id).toEqual(uid);
  });
});

describe("Logout API", () => {
  it("returns 403 on logout when no cookie provided", async (done) => {
    await request(app).get("/api/auth/logout").expect(403);
    done();
  });

  it("returns 200 with cookie provided", async (done) => {
    await login(app, testCreatedUsers[0]);
    const sid =
      cookieParser.signedCookie(
        cookie.parse(cookieJar.get()).parlourSession,
        process.env.SESSION_SECRET
      ) || "not found";
    const sess: ParlourSession = await findSession(sid);
    expect(sess.sess.user_id).toEqual(testCreatedUsers[0].uid);

    const req = request(app)
      .get("/api/auth/logout")
      .set("cookie", cookieJar.get());
    await req.expect(200);
    expect(findSession(sid)).resolves.toEqual(nullSession);
    done();
  });
});

describe("Graphql queries", () => {
  const graphqlAllUsers = {
    query: `
         {
          users {
            nodes {
              firstName
              lastName
              email
              uid
            }
          }
        }`,
  };

  it("returns 401 on basic query w/ no auth", async (done) => {
    await request(app).post("/graphql").send(graphqlAllUsers).expect(401);
    done();
  });

  it("returns 401 with unsigned cookie provided", async (done) => {
    await login(app, testCreatedUsers[0]);
    const sid =
      cookieParser.signedCookie(
        cookie.parse(cookieJar.get()).parlourSession,
        process.env.SESSION_SECRET
      ) || "not found";
    const sess: ParlourSession = await findSession(sid);
    expect(sess.sess.user_id).toEqual(testCreatedUsers[0].uid);

    const req = request(app)
      .post("/graphql")
      .set("cookie", `parlourSession=${sid}`)
      .send(graphqlAllUsers);
    await req.expect(401);
    done();
  });

  it("returns 200 logged in user object only on basic query w/ auth", async (done) => {
    const u = testCreatedUsers[0];
    await login(app, u);

    await request(app)
      .post("/graphql")
      .set("cookie", cookieJar.get())
      .send(graphqlAllUsers)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          data: {
            users: {
              nodes: [
                {
                  firstName: u.firstName,
                  lastName: u.lastName,
                  email: u.email,
                  uid: u.uid,
                },
              ],
            },
          },
        });
      });
    done();
  });

  // it("returns 200 all user objects on users query w/ admin auth", async (done) => {
  //   const u = testCreatedUsers[0];
  //   await login(app, u);

  //   await request(app)
  //     .post("/graphql")
  //     .set("cookie", cookieJar.get())
  //     .send(graphqlAllUsers)
  //     .expect(200)
  //     .expect((res) => {
  //       expect(res.body.data.users.nodes.length()).toEqual(10);
  //     });
  //   done();
  // });

  // it("returns 200 on whoami w/ auth", async (done) => {
  //   const u = testCreatedUsers[0];
  //   await login(app, u);

  //   const whoami = {
  //     query: `{
  //               whoami {
  //                 firstName
  //                 lastName
  //                 email
  //                 uid
  //               }
  //             }`,
  //   };
  //   await request(app)
  //     .post("/graphql")
  //     .set("cookie", cookieJar.get())
  //     .send(whoami)
  //     .expect(200, {
  //       data: {
  //         users: {
  //           nodes: [
  //             {
  //               firstName: "Dan",
  //               lastName: "B",
  //               email: "db",
  //               uid: "test",
  //             },
  //           ],
  //         },
  //       },
  //     });
  //   done();
  // });
});
