import React from "react";
import App from "../App";
import TestRenderer from "react-test-renderer";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Apollo uses fetch which doesn't exist in node.js
const realFetch = window.fetch;

beforeAll(() => {
  // Apollo uses fetch which doesn't exist in node.js
  window.fetch = jest.fn();
});

afterAll(() => {
  window.fetch = realFetch;
});

test("App can render correctly", () => {
  // Test first render and componentDidMount
  const component = TestRenderer.create(<App />);
  const tree = component.toJSON();

  expect(tree).toMatchSnapshot();
});

describe("render the App in the DOM, and navigate", () => {
  test("render the App in the DOM, and display About component", () => {
    const { getByText } = render(<App />);
    expect(getByText("A Place for", { exact: false }));
    expect(getByText("Login"));
  });

  test("navigate to the login page", () => {
    const { getByText } = render(<App />);
    fireEvent.click(getByText("Login"));
    expect(getByText("Sign In"));
  });

  test("navigate to the signup page", () => {
    const { getByText } = render(<App />);
    fireEvent.click(getByText("Sign Up"));
    expect(getByText("Get started by signing in with Google"));
  });
});
