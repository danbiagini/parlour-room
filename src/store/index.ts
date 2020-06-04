
import { createStore } from "redux";
import { userReducer } from "./gameReducer";
import { ActionAuthIdp, User } from "../common/types";

// const gameReducer = combineReducers({
//     userReducer
// });

export type RootState = ReturnType<typeof userReducer>;
export const store = createStore<User, ActionAuthIdp, null, null>(userReducer);
