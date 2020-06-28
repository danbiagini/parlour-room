import * as actions from "../../store/actions";
import * as types from "../../common/types";
import {
  appReducer as reducer,
  initState,
  initUser,
} from "../../store/gameReducer";
import { Login } from "../Login";
import { SignUp } from "../SignUp";
import { store } from "../../store/index";
import { testUser } from "../../db/test/helper";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { serverAuth, serverReg } from "../Auth";

const axiosMock = jest.fn();

beforeAll(async () => {
  jest.spyOn(axios, "get").mockImplementation(axiosMock);
  jest.spyOn(axios, "post").mockImplementation(axiosMock);
});

afterAll(async () => {
  jest.restoreAllMocks();
});

const partialActAuthIdp: types.ActionAuthIdp = {
  type: types.ACTIONS.AUTH_IDP,
  payload: {
    user: null,
    idp_token: null,
  },
};

describe("actions", () => {
  it("should create a login action", () => {
    const expectedAction: types.ActionAuthIdp = {
      type: types.ACTIONS.AUTH_IDP,
      payload: {
        user: testUser,
        idp_token: "token",
      },
    };
    expect(actions.signinIdp(testUser, "token")).toEqual(expectedAction);
  });
});

describe("User state reducers", () => {
  it("should have initial state", () => {
    expect(reducer(undefined, partialActAuthIdp)).toEqual({
      user: initUser,
      idp_token: null,
    });
  });

  it("should handle sign in with google", () => {
    expect(reducer(initState, actions.signinIdp(testUser, "token"))).toEqual({
      user: testUser,
      idp_token: "token",
    });
  });
});

describe("Login with google", () => {
  it("should render a button", () => {
    const { getByText } = render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>
    );
    const button = getByText("Sign in with Google");
    expect(button).toBeTruthy();
    fireEvent.click(button);
  });

  it("should return the User on success", () => {
    axiosMock.mockResolvedValueOnce({
      data: testUser,
      code: 200,
    });
    expect(serverAuth(testUser, "token123")).resolves.toBe(testUser);
  });
});

describe("Signup with google", () => {
  it("should return the User on success", () => {
    axiosMock.mockResolvedValueOnce({
      data: testUser,
      code: 200,
    });
    expect(serverReg(testUser, "token123")).resolves.toBe(testUser);
  });
});
