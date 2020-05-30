import * as actions from "../src/store/actions";
import * as types from "../src/store/types";
import { userReducer as reducer, initUser } from "../src/store/gameReducer";
import { Login } from "../src/components/Login";
import { store } from "../src/store/index";
import { testUser } from "../db/test/helper";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// const testUser: types.User = {
//   isSignedIn: true,
//   idpId: "12345",
//   idp: types.IDP.GOOGLE,
//   firstName: "Dan",
//   email: "dan@smartguys.com",
//   about: "smart guy"
// };

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

describe("Login with google", () => {
  // const prof = {
  //   name: "Dan Bonj",
  //   email: "dbonj@smartguys.org",
  //   googleId: "123456789",
  //   imageUrl: "https://profiles.dev/123456789",
  //   familyName: "Bonj",
  //   givenName: "Dan"
  // };

  // const resp = {
  //   profileObj: prof,
  //   googleId: "123456789",
  //   tokenId: "token123",
  // };
    
  it("should render a button", () => {
    const { getByText } = render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>
    );
    const button = getByText("Sign in with Google");
    expect(button);
    fireEvent.click(button);
  });

  // it("should setup the User on success", () => {
  //   let auth = serverAuth(testUser, "token123").then(response => {

  //   });
  // });
});