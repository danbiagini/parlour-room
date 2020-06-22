import { configureStore } from "@reduxjs/toolkit";
import { userReducer } from "./gameReducer";

export type RootState = ReturnType<typeof userReducer>;
export const store = configureStore({ reducer: userReducer });
