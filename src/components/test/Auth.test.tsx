/* eslint-disable no-debugger */
import * as actions from "../../store/actions";
import * as types from "../../common/types";
import {
  appReducer as reducer,
  initState,
  initUser,
} from "../../store/gameReducer";
import { Login } from "../Login";
import { SignUp } from "../SignUp";
import Routes from "../Routes";
import React from "react";
import {
  screen,
  fireEvent,
  waitForElementToBeRemoved,
  waitFor,
} from "@testing-library/dom";
import { wrappedRender } from "./helper";
import "@testing-library/jest-dom";
import axios from "axios";
import Auth from "../Auth";
import { act } from "react-dom/test-utils";

const testUser: types.User = {
  isSignedIn: false,
  idpId: "12345",
  idp: types.IDP.GOOGLE,
  lastName: "Last",
  firstName: "Dan",
  email: "dan@smartguys.com",
  about: "smart guy",
  username: "notNull@thatsforsure.com",
  profPicUrl: "http://mypic.com/1234567",
};

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

// afterEach(() => {
//   cleanup();
// });

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
    wrappedRender(<Login />);
    const button = screen.getByRole("button", { name: "Sign in with Google" });
    expect(button).toBeTruthy();
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
  it("Sign in with google modal should be removed after login", async () => {
    const { store } = wrappedRender(<SignUp />);
    expect(
      screen.getByText("Get started by signing in with Google")
    ).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Sign in with Google" });
    expect(button).toBeTruthy();

    act(() => {
      store.dispatch(
        actions.signinIdp(testUser, "testSignInWithGOogleIdToken")
      );
    });

    await waitForElementToBeRemoved(() =>
      screen.queryByText("Get started by signing in with Google")
    );
  });

  it("should get success after edit and submit sign up form", async () => {
    const { store } = wrappedRender(<Routes />, ["/signup"]);

    act(() => {
      store.dispatch(
        actions.signinIdp(testUser, "testSignInWithGOogleIdToken")
      );
    });

    const email_sub = screen.getByLabelText(
      "Receive occassional email updates?"
    );
    expect(email_sub).not.toBeChecked();
    expect(screen.getByDisplayValue("http://mypic.com/1234567"));
    expect(screen.getByLabelText("First Name")).toHaveValue("Dan");
    const last_input = screen.getByLabelText("Last Name");
    expect(last_input).toHaveValue("Last");

    fireEvent.change(last_input, { target: { value: "Bonjini" } });
    expect(last_input).toHaveValue("Bonjini");
    fireEvent.click(email_sub);
    expect(email_sub).toBeChecked();

    testUser.isSignedIn = true;
    testUser.lastName = "Bonjini";
    testUser.email_subscription = true;
    testUser.username = testUser.email;
    axiosMock.mockResolvedValueOnce({
      data: testUser,
      status: 200,
    });

    const submit = screen.getByRole("button", { name: "Submit" });
    fireEvent.click(submit);
    await waitFor(() => {
      expect(screen.getByText("Welcome Dan!")).toBeInTheDocument();
    });
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
