import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface wishlistState {
  likedProducts: string[]; // Store liked product slugs
}

const initialState: wishlistState = {
  likedProducts: typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("likedProducts") || "[]")
    : [],
};

const wishlistSlice = createSlice({
  name: "likes",
  initialState,
  reducers: {
    toggleLike: (state, action: PayloadAction<string>) => {
      const slug = action.payload;
      if (state.likedProducts.includes(slug)) {
        state.likedProducts = state.likedProducts.filter((item) => item !== slug);
      } else {
        state.likedProducts.push(slug);
      }
      localStorage.setItem("likedProducts", JSON.stringify(state.likedProducts));
    },
  },
});

export const { toggleLike } = wishlistSlice.actions;
export default wishlistSlice.reducer;
