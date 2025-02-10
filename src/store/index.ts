import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./features/cartSlice";
import wishlistReducer from "./features/wishlistSlice"; 
// import userReducer from "./features/userSlice";
// import productReducer from "./features/productSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    likes: wishlistReducer,
    // user: userReducer,
    // product: productReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
