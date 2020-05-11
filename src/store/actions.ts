import { User, ActionAuthIdp, ACTIONS } from "./types";
// import { initUser } from "./gameReducer";

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

