
export enum IDP {
  GOOGLE,
}

export enum ACTIONS {
	AUTH_IDP = "AUTH_IDP",
	SIGNOUT = "SIGNOUT",
	INVALID = "INVALID"
}

export interface User {
  isSignedIn: boolean;
  name?: string;
  email?: string;
  idp?: IDP;
  id?: string;
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
