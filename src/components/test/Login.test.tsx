import * as actions from "../../store/actions";
import * as types from "../../common/types";
import { userReducer as reducer, initUser } from "../../store/gameReducer";
import { Login } from "../Login";
import { store } from "../../store/index";
import { testUser } from "../../db/test/helper";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { serverAuth } from "../Auth";

const axiosMock = jest.fn();

beforeAll(async () => {
  jest.spyOn(axios, "get").mockImplementation(axiosMock);
});

afterAll(async () => {
  jest.restoreAllMocks();
});

const partialActAuthIdp: types.ActionAuthIdp = {
  type: types.ACTIONS.AUTH_IDP,
  payload: null,
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

  it("should setup the User on success", () => {
    axiosMock.mockResolvedValueOnce({
      data: testUser,
      code: 200,
    });
    expect(serverAuth(testUser, "token123")).resolves.toBe(testUser);
  });
});
