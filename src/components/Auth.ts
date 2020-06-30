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
    return idpLogout();
  }

  public async serverReg(user: User, id_token: string) {
    console.log("starting server new user registration");
    const axRes = await this._apiClient.post<User>(
      `/api/auth/${user.idp}/register`,
      user,
      {
        params: { code: id_token },
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

  public async serverAuth(_user: User, id_token: string) {
    console.log("starting server authentication");
    const axRes = await this._apiClient.get<User>(
      "/api/auth/google.com/login",
      {
        params: { code: id_token },
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
}
