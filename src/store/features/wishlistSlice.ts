import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WishlistState {
  likedProducts: string[];
}

const initialState: WishlistState = {
  likedProducts: [], // Avoid accessing localStorage on the server
};

const wishlistSlice = createSlice({
  name: "likes",
  initialState,
  reducers: {
    setLikedProducts: (state, action: PayloadAction<string[]>) => {
      state.likedProducts = action.payload;
    },
    toggleLike: (state, action: PayloadAction<string>) => {
      const slug = action.payload;
      const updatedLikedProducts = state.likedProducts.includes(slug)
        ? state.likedProducts.filter((item) => item !== slug)
        : [...state.likedProducts, slug];

      state.likedProducts = updatedLikedProducts;
      localStorage.setItem("likedProducts", JSON.stringify(updatedLikedProducts));
    },
  },
});

export const { toggleLike, setLikedProducts } = wishlistSlice.actions;
export default wishlistSlice.reducer;
