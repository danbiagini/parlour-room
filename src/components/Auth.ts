import axios from "axios";
import { User, ApiResponse } from "../common/types";

const apiClient = axios.create({
  responseType: "json",
  headers: {
    "Content-Type": "application/json",
  },
});

export const serverAuth = async (_user: User, id_token: string) => {
  console.log("starting server authentication");
  const axRes = await apiClient.get<User>("/api/auth/google.com/login", {
    params: { code: id_token },
    validateStatus: (status) => {
      return status < 500;
    },
  });
  const response: ApiResponse = {
    data: axRes.data,
    code: axRes.status,
  };
  return response;
};
