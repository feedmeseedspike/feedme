import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./features/cartSlice";
import wishlistReducer from "./features/wishlistSlice";
import browsingHistoryReducer from "./features/browsingHistorySlice";
import optionsReducer from "./features/optionsSlice";
import walletReducer from "./features/walletSlice";
import { 
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER 
} from "redux-persist";
import { combineReducers } from "redux";

// Conditionally import storage or use a no-op storage for SSR
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: string) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

const storage = typeof window !== 'undefined'
  ? require("redux-persist/lib/storage").default
  : createNoopStorage();

const cartPersistConfig = {
  key: "cart",
  storage,
};

const browsingHistoryPersistConfig = {
  key: "browsingHistory",
  storage,
};

const optionsPersistConfig = {
  key: "options",
  storage,
  whitelist: ['selectedOptions'],
};

const walletPersistConfig = {
  key: "wallet",
  storage,
  whitelist: ['balance'],
};

const rootReducer = combineReducers({
  cart: persistReducer(cartPersistConfig, cartReducer),
  likes: wishlistReducer,
  options: persistReducer(optionsPersistConfig, optionsReducer),
  browsingHistory: persistReducer(browsingHistoryPersistConfig, browsingHistoryReducer),
  wallet: persistReducer(walletPersistConfig, walletReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;