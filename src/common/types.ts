export enum IDP {
  NONE = "none",
  GOOGLE = "google.com",
}

export enum ACTIONS {
  AUTH_IDP = "AUTH_IDP",
  SIGNOUT = "SIGNOUT",
  INVALID = "INVALID",
}

export interface User {
  isSignedIn: boolean;
  username?: string;
  lastName?: string;
  firstName?: string;
  about?: string;
  email?: string;
  email_subscription?: boolean;
  idp?: IDP;
  idpId?: string;
  profPicUrl?: string;
  uid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppState {
  user: User;
  idp_token: string;
}

export interface ActionAuthIdp {
  type: typeof ACTIONS.AUTH_IDP;
  payload: {
    user: Partial<User>;
    idp_token: string;
  };
}

export interface DispatchAction {
  payload: Partial<AppState>;
}

export type UserActionTypes = ActionAuthIdp;

export interface ApiResponse {
  code: number;
  data: User;
}

export interface ApiError {
  code: string;
  data: string;
}

export function isApiError(
  response: ApiError | ApiResponse
): response is ApiError {
  return (response as ApiResponse).data === undefined;
}
