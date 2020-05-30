
export enum IDP {
  NONE = "none",
  GOOGLE = "google.com"
}

export enum ACTIONS {
	AUTH_IDP = "AUTH_IDP",
	SIGNOUT = "SIGNOUT",
	INVALID = "INVALID"
}

export interface User {
  isSignedIn: boolean;
  username?: string;
  lastName?: string;
  firstName?: string;
  about?: string;
  email?: string;
  idp?: IDP;
  idpId?: string;
  profPicUrl?: string;
  uid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppState {
  user: User;
}

export interface ActionAuthIdp {
  type: typeof ACTIONS.AUTH_IDP;
  payload: Partial<User>;
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
  code: number;
  description: string;
}

export function isApiError(response: ApiError | ApiResponse): response is ApiError {
  return (response as ApiResponse).data === undefined;
}