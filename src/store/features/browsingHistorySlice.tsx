import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Product = {
  id: string;
  category: string;
};

type BrowsingHistoryState = {
  products: Product[];
};

const initialState: BrowsingHistoryState = {
  products: [],
};

const browsingHistorySlice = createSlice({
  name: "browsingHistory",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) state.products.splice(index, 1); // Remove duplicate
      state.products.unshift(action.payload); // Add to the start

      if (state.products.length > 10) state.products.pop(); // Keep only the latest 10
    },
    clearHistory: (state) => {
      state.products = [];
    },
  },
});

export const { addItem, clearHistory } = browsingHistorySlice.actions;
export default browsingHistorySlice.reducer;
