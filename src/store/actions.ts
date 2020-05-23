import { User, ActionAuthIdp, ACTIONS, IDP } from "./types";
// import { initUser } from "./gameReducer";

export const signoutIdp = () : ActionAuthIdp => {
  const newUser: User = {
    name: "",
    email: "",
    idp: IDP.NONE,
    isSignedIn: false,
    id: ""
  };
  return ({
    type: ACTIONS.AUTH_IDP,
    payload: newUser
  });
};

export const signinIdp = (user: User): ActionAuthIdp => {

  const newUser: User = {
    name: user.name,
    email: user.email,
    idp: user.idp,
    isSignedIn: user.isSignedIn,
    id: user.id,
  };
	
  const act: ActionAuthIdp = {
    type: ACTIONS.AUTH_IDP,
    payload: newUser,
  };
  return act;
};

