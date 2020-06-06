import React from "react";
import App from "../App";
import TestRenderer from "react-test-renderer";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

test("App can render correctly", () => {
  // Test first render and componentDidMount
  const component = TestRenderer.create(<App />);
  const tree = component.toJSON();

  expect(tree).toMatchSnapshot();
});

describe("render the App in the DOM, and navigate", () => {
  test("render the App in the DOM, and display About component", () => {
    const { getByText } = render(<App />);
    expect(getByText("Wikipedia"));
    expect(getByText("A Place for", { exact: false }));
    expect(getByText("Login"));
  });

  test("navigate to the login page", () => {
    const { getByText } = render(<App />);
    fireEvent.click(getByText("Login"));
    expect(getByText("Sign In"));
  });
});
