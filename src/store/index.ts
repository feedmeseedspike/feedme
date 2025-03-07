import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./features/cartSlice";
import wishlistReducer from "./features/wishlistSlice"; 
// import userReducer from "./features/userSlice";
// import productReducer from "./features/productSlice";
import browsingHistoryReducer from "./features/browsingHistorySlice";
import optionsReducer from "./features/optionsSlice";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";

const persistConfig = {
  key: "browsingHistory",
  storage,
};

const persistedReducer = persistReducer(persistConfig, browsingHistoryReducer);


export const store = configureStore({
  reducer: {
    cart: cartReducer,
    likes: wishlistReducer,
    options: optionsReducer,
    browsingHistory: persistedReducer,
    // user: userReducer,
    // product: productReducer,
  },
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
