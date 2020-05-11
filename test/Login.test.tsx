// import React from "react";
// import App from "../src/components/App";
import * as actions from "../src/store/actions";
import * as types from "../src/store/types";
import { userReducer as reducer, initUser } from "../src/store/gameReducer";

const testUser: types.User = {
  isSignedIn: true,
  id: "12345",
  idp: types.IDP.GOOGLE,
  name: "Dan B",
  email: "dan@smartguys.com",
};

const partialActAuthIdp: types.ActionAuthIdp = {
  type: types.ACTIONS.AUTH_IDP,
  payload: null
};

describe("actions", () => {
  it("should create a login action", () => {
    const expectedAction: types.ActionAuthIdp = {
      type: types.ACTIONS.AUTH_IDP,
      payload: testUser,
    };
    expect(actions.signinIdp(testUser)).toEqual(expectedAction);
  });

});

describe("User state reducers", () => {
  it("should have initial state", () => {
    expect(reducer(undefined, partialActAuthIdp)).toEqual(initUser);
  });

  it("should handle sign in with google", () => {
    expect(reducer(initUser, actions.signinIdp(testUser))).toEqual(testUser);
  });

});
