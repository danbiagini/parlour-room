import { Reducer } from "redux";
import { ACTIONS, AppState, User, ActionAuthIdp } from "../common/types";

export const initState: AppState = {
  user: null,
};

export const initUser: User = {
  isSignedIn: false,
};

export const userReducer: Reducer<User, ActionAuthIdp> = (
  state = initUser,
  action
) => {
  // tslint:disable-next-line: no-console
  console.log("Action:", action);
  switch (action.type) {
    case ACTIONS.AUTH_IDP:
      if (action.payload) {
        return {
          ...state,
          isSignedIn: action.payload.isSignedIn,
          username: action.payload.username,
          lastName: action.payload.lastName,
          firstName: action.payload.firstName,
          email: action.payload.email,
          idp: action.payload.idp,
          idpId: action.payload.idpId,
          about: action.payload.about,
          profPicUrl: action.payload.profPicUrl,
        };
      }
      return {
        ...state,
        isSignedIn: false,
      };
    default:
      return state;
  }
};
