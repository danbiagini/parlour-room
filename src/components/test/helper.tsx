import * as React from "react";
import { render as rtlRender, RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";

import { store } from "../../store/index";
import { MemoryRouter } from "react-router-dom";
import { createStore } from "redux";
import { appReducer, initState } from "../../store/gameReducer";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { MyParloursAndInvitesDocument } from "../../generated/graphql";

const mocks: MockedResponse[] = [
  {
    request: {
      query: MyParloursAndInvitesDocument,
    },
    result: () => {
      return {
        data: {
          currentUserMemberParlours: {
            nodes: [],
          },
          getCurrentUserInvites: {
            nodes: [
              {
                parlourByParlourUid: {
                  name: "Biagini's Parlour",
                  description: "Fixture Parlour",
                  uid: "270c4eb5-4bc0-4884-81c8-4234b48d15aa",
                  userByCreatorUid: null,
                  createdAt: "2020-08-30T02:18:46.089262+00:00",
                  updatedAt: "2020-08-30T02:18:46.089262+00:00",
                },
                createdAt: "2020-08-30T02:18:46.098483+00:00",
                userByCreatorUid: null,
                expiresAt: null,
              },
            ],
          },
        },
      };
    },
  },
];

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
    <MockedProvider mocks={mocks}>
      <Provider store={store}>
        <MemoryRouter initialEntries={history}>{props.children}</MemoryRouter>
      </Provider>
    </MockedProvider>
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
