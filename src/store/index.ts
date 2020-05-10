
import { createStore, combineReducers } from "redux";
import { userReducer } from "./gameReducer";
import { ActionSignin, User } from "./types";

const gameReducer = combineReducers({
    userReducer
});

export type RootState = ReturnType<typeof gameReducer>;
export const store = createStore<User, ActionSignin, null, null>(userReducer);
