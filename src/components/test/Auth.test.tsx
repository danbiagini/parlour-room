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
import Auth from "../Auth";

jest.mock("axios");
const axiosMock = jest.fn();

(axios.create as jest.Mock).mockReturnValue({
  get: axiosMock,
  post: axiosMock,
});

afterAll(async () => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  axiosMock.mockClear();
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

  it("should return the User on success", async () => {
    axiosMock.mockResolvedValueOnce({
      data: testUser,
      status: 200,
    });
    const auth = new Auth();
    await expect(auth.serverAuth(testUser, "token123")).resolves.toStrictEqual({
      data: testUser,
      code: 200,
    });
    expect(axiosMock.mock.calls).toHaveLength(1);
  });
});

describe("Signup with google", () => {
  it("should render a button", () => {
    const { getByText } = render(
      <Provider store={store}>
        <MemoryRouter>
          <SignUp />
        </MemoryRouter>
      </Provider>
    );
    const button = getByText("Sign in with Google");
    expect(button).toBeTruthy();
    fireEvent.click(button);
  });
  it("should return the User on success", async () => {
    axiosMock.mockResolvedValueOnce({
      data: testUser,
      status: 200,
    });
    const auth = new Auth();
    await expect(auth.serverReg(testUser, "token123")).resolves.toStrictEqual({
      data: testUser,
      code: 200,
    });
    expect(axiosMock.mock.calls).toHaveLength(1);
  });
});
