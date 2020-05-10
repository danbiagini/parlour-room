
export enum IDP {
  GOOGLE,
}

export enum ACTIONS {
	SIGNIN = "SIGNIN",
	SIGNOUT = "SIGNOUT"
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

export interface ActionSignin {
  type: typeof ACTIONS.SIGNIN;
  payload: Partial<User>;
}

export interface DispatchAction {
  payload: Partial<AppState>;
}

export type UserActionTypes = ActionSignin;
