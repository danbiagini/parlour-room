
import { createStore, combineReducers } from "redux";
import { userReducer } from "./gameReducer";
import { ActionAuthIdp, User } from "./types";

const gameReducer = combineReducers({
    userReducer
});

export type RootState = ReturnType<typeof gameReducer>;
export const store = createStore<User, ActionAuthIdp, null, null>(userReducer);
