import React from "react";
import App from "../src/components/App";
import TestRenderer from "react-test-renderer";

test("App can render correctly", () => {
  // Test first render and componentDidMount
  const component = TestRenderer.create(<App />);
  const tree = component.toJSON();
	
  expect(tree).toMatchSnapshot();

});
