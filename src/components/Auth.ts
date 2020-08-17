import axios, { AxiosInstance } from "axios";
import { User, ApiResponse } from "../common/types";

export default class Auth {
  private _apiClient: AxiosInstance;

  constructor() {
    this._apiClient = axios.create({
      responseType: "json",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  public async logOut(idpLogout: () => void) {
    console.log("logging out");
    await this._apiClient.get("/api/auth/logout");
    return idpLogout();
  }

  public async serverReg(user: User, id_token: string) {
    console.log("starting server new user registration");
    const axRes = await this._apiClient.post<User>(
      `/api/auth/${user.idp}/register`,
      user,
      {
        // params: { code: id_token },
        headers: { Authorization: `Bearer ${id_token}` },
        validateStatus: (status) => {
          return status < 500;
        },
      }
    );
    const response: ApiResponse = {
      data: axRes.data,
      code: axRes.status,
    };
    return response;
  }

  public async serverAuth(
    _user: User,
    id_token: string,
    checkAdmin: boolean = false
  ) {
    const endpoint =
      "/api/auth/google.com/login" + (checkAdmin ? "?admin=true" : "");
    const axRes = await this._apiClient.get<User>(endpoint, {
      // params: { code: id_token },
      headers: { Authorization: `Bearer ${id_token}` },
      validateStatus: (status) => {
        return status < 500;
      },
    });
    const response: ApiResponse = {
      data: axRes.data,
      code: axRes.status,
    };
    return response;
  }
}

export const auth = new Auth();
