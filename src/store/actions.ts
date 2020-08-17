import { User, ActionAuthIdp, ACTIONS, IDP } from "../common/types";

export const signoutIdp = (): ActionAuthIdp => {
  const newUser: User = {
    firstName: "",
    email: "",
    idp: IDP.NONE,
    isSignedIn: false,
    email_subscription: false,
    idpId: "",
    about: "",
    username: "",
    lastName: "",
  };
  return {
    type: ACTIONS.AUTH_IDP,
    payload: {
      user: newUser,
      idp_token: null,
    },
  };
};

export const signinIdp = (user: User, token: string): ActionAuthIdp => {
  const newUser: User = {
    firstName: user.firstName,
    email: user.email,
    email_subscription: user.email_subscription,
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
    payload: {
      user: newUser,
      idp_token: token,
    },
  };
  return act;
};
