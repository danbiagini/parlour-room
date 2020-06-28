import { Reducer } from "redux";
import { ACTIONS, AppState, User, ActionAuthIdp } from "../common/types";

export const initUser: User = {
  isSignedIn: false,
  email: "",
  firstName: "",
  lastName: "",
  email_subscription: false,
  about: "",
  profPicUrl: "",
  idp: undefined,
  idpId: undefined,
};

export const initState: AppState = {
  user: initUser,
  idp_token: null,
};

export const appReducer: Reducer<AppState, ActionAuthIdp> = (
  state = initState,
  action
) => {
  // tslint:disable-next-line: no-console
  console.log("Action:", action);
  switch (action.type) {
    case ACTIONS.AUTH_IDP:
      if (action.payload && action.payload.user) {
        const u = action.payload.user;
        const stateUser: User = {
          isSignedIn: u.isSignedIn,
          username: u.username,
          lastName: u.lastName,
          firstName: u.firstName,
          email: u.email,
          email_subscription: u.email_subscription,
          idp: u.idp,
          idpId: u.idpId,
          about: u.about,
          profPicUrl: u.profPicUrl,
        };
        return {
          ...state,
          user: stateUser,
          idp_token: action.payload.idp_token || "",
        };
      }
      return {
        ...state,
        user: initUser,
        idp_token: null,
      };
    default:
      return state;
  }
};
