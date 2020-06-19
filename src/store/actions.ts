import { User, ActionAuthIdp, ACTIONS, IDP } from "../common/types";

export const signoutIdp = (): ActionAuthIdp => {
  const newUser: User = {
    firstName: "",
    email: "",
    idp: IDP.NONE,
    isSignedIn: false,
    idpId: "",
    about: "",
    username: "",
    lastName: "",
  };
  return {
    type: ACTIONS.AUTH_IDP,
    payload: newUser,
  };
};

export const signinIdp = (user: User): ActionAuthIdp => {
  const newUser: User = {
    firstName: user.firstName,
    email: user.email,
    idp: user.idp,
    isSignedIn: user.isSignedIn,
    idpId: user.idpId,
    lastName: user.lastName,
    username: user.username,
    profPicUrl: user.profPicUrl,
    about: user.about,
  };

  const act: ActionAuthIdp = {
    type: ACTIONS.AUTH_IDP,
    payload: newUser,
  };
  return act;
};
