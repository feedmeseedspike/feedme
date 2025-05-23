import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./features/cartSlice";
import wishlistReducer from "./features/wishlistSlice";
import browsingHistoryReducer from "./features/browsingHistorySlice";
import optionsReducer from "./features/optionsSlice";
import favoritesReducer from "./features/favoritesSlice";
import storage from "redux-persist/lib/storage";
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

const rootReducer = combineReducers({
  cart: persistReducer(cartPersistConfig, cartReducer),
  likes: wishlistReducer,
  options: persistReducer(optionsPersistConfig, optionsReducer),
  browsingHistory: persistReducer(browsingHistoryPersistConfig, browsingHistoryReducer),
  favorites: favoritesReducer,
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