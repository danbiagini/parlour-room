import { Reducer } from "redux";
import { ACTIONS, AppState, User, ActionAuthIdp } from "./types";

export const initState: AppState = {
  user: null,
};

export const initUser: User = {
  isSignedIn: false,
};

export const userReducer: Reducer<User, ActionAuthIdp> = (state = initUser, action) => {
  // tslint:disable-next-line: no-console
  console.log("Action:", action);
  switch (action.type) {
    case ACTIONS.AUTH_IDP:
      if (action.payload && action.payload.isSignedIn) {
        return {
          ...state,
          isSignedIn: true,
          name: action.payload.name,
          email: action.payload.email,
          idp: action.payload.idp,
          id: action.payload.id,
        };
      }
      // this shouldn't happen, SIGNIN
      console.warn("signin action called with isSignedIn = false");
      return {
        ...state,
        isSignedIn: false,
      };
    default:
      return state;
  }
};
