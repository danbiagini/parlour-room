import { User, ActionSignin, IDP, ACTIONS } from "./types";
import { initUser } from "./gameReducer";

export const signin = (user: User) => {
  if (!user.isSignedIn) {
    return initUser;
  }

  if (user.idp != IDP.GOOGLE) {
    console.error(`IDP: ${user.idp} not supported`);
    return initUser;
  }

  const newUser: User = {
    name: user.name,
    email: user.email,
    idp: user.idp,
    isSignedIn: true,
  };
  const act: ActionSignin = {
    type: ACTIONS.SIGNIN,
    payload: newUser,
  };
  return act;
};
