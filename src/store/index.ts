import { configureStore } from "@reduxjs/toolkit";
import { appReducer } from "./gameReducer";

export type RootState = ReturnType<typeof appReducer>;
export const store = configureStore({ reducer: appReducer });
