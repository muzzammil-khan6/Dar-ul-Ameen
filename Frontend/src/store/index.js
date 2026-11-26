import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";

import authReducer from "./slices/authSlice";
import publicTeachersReducer from "./slices/publicTeachersSlice";
import studentReducer from "./slices/studentSlice";
import teacherReducer from "./slices/teacherSlice";
import adminReducer from "./slices/adminSlice";
import chatReducer from "./slices/chatSlice";
import inviteReducer from "./slices/inviteSlice";
import friendReducer from "./slices/friendSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  publicTeachers: publicTeachersReducer,
  student: studentReducer,
  teacher: teacherReducer,
  admin: adminReducer,
  chat: chatReducer,
  invite: inviteReducer,
  friend: friendReducer,
});

// Resilient browser localStorage engine for redux-persist in Vite/ESM
const localStorageEngine = {
  getItem: (key) => {
    try {
      return Promise.resolve(typeof window !== "undefined" ? window.localStorage.getItem(key) : null);
    } catch (e) {
      return Promise.resolve(null);
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
      return Promise.resolve(value);
    } catch (e) {
      return Promise.resolve();
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  },
};

const persistConfig = {
  key: "dar-ul-ameen-root",
  storage: localStorageEngine,
  whitelist: ["auth"], // persist auth token and user
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
