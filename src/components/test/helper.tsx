import * as React from "react";
import { render as rtlRender, RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";

import { store } from "../../store/index";
import { MemoryRouter } from "react-router-dom";
import { createStore } from "redux";
import { appReducer, initState } from "../../store/gameReducer";

interface ProviderProps {
  children?: React.ReactNode;
}
export const wrappedRender = (
  node: React.ReactNode,
  history = ["/"],
  state = initState,
  whichRender = rtlRender,
  options?: RenderOptions
) => {
  const store = createStore(appReducer, state);
  const WrapDefaultProvider = (props: ProviderProps) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={history}>{props.children}</MemoryRouter>
    </Provider>
  );

  const ret = whichRender(
    <WrapDefaultProvider>{node}</WrapDefaultProvider>,
    options
  );
  return { store, ...ret };
};

type RenderParams = Parameters<typeof rtlRender>;

export const customRender = (
  ui: RenderParams[0],
  myStore = store,
  options?: RenderParams[1]
) => {
  const Wrapper: React.FC<ProviderProps> = ({ children }: ProviderProps) => {
    return (
      <Provider store={myStore}>
        <MemoryRouter>{children}</MemoryRouter>
      </Provider>
    );
  };

  return rtlRender(ui, { wrapper: Wrapper, ...options });
};
