import { User } from "../../common/types";
import { LoginTicket, TokenPayload } from "google-auth-library";
import { agent as request } from "supertest";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithin: (low: number, high: number) => R;
    }
  }
}

expect.extend({
  toBeWithin(received: number, low: number, high: number) {
    const pass = received >= low && received <= high;
    if (pass) {
      return {
        message: () =>
          `expected ${received} to not be within range ${low} to ${high} (inclusive)`,
        pass: true,
      };
    }
    return {
      message: () =>
        `expected ${received} to be within range ${low} to ${high} (inclusive)`,
      pass: false,
    };
  },
});

export const validToken = (user: User): TokenPayload => {
  return {
    sub: user.idpId,
    iss: "accounts.google.com",
    aud: "",
    exp: Date.now() + 600,
    iat: Date.now() - 600,
    email_verified: true,
    email: user.email,
  };
};

export const mockedVerifyIdToken = jest.fn();
export const mockedGetPayload = jest.fn();

export class cookieJar {
  static currentCookie: string;
  static set = (cookie: string) => {
    cookieJar.currentCookie = cookie;
  };
  static get = (): string => {
    return cookieJar.currentCookie;
  };
}

export const login = async (
  app: Express.Application,
  user: User,
  query?: string
) => {
  return new Promise((resolve) => {
    const token = validToken(user);
    mockedGetPayload.mockReturnValueOnce(token);
    const myTicket: LoginTicket = new LoginTicket();
    mockedVerifyIdToken.mockResolvedValueOnce(myTicket);

    const endpoint =
      "/api/auth/google.com/login" + String(query ? `?${query}` : "");

    const agent = request(app)
      .get(endpoint)
      .set("Authorization", "Bearer mocksAsValid-LoginTestFunc")
      .then((res) => {
        // response should have user signed in
        let localUser: User = {
          isSignedIn: true,
        };
        Object.assign(localUser, user);
        localUser.isSignedIn = true;

        // timestamp won't match when login was done previously
        delete localUser.lastSignin;

        expect(res.status).toBe(200);
        expect(res.header["set-cookie"][0]).toMatch(
          /parlourSession=.*; Path=\/; Expires=.*; HttpOnly; SameSite=Strict/
        );
        // res.body.lastSignin = new Date(res.body.lastSignin);
        expect(res.body).toMatchObject(localUser);
        cookieJar.set(res.header["set-cookie"][0]);
        const now = Date.now();
        expect(new Date(res.body.lastSignin).valueOf()).toBeWithin(
          now.valueOf() - 1000,
          now.valueOf()
        );
        resolve(agent);
      });
  });
};
