import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "src/utils/supabase/client";

interface FavoritesState {
  favorites: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FavoritesState = {
  favorites: [],
  isLoading: false,
  error: null,
};

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    setFavorites: (state, action: PayloadAction<string[]>) => {
      state.favorites = action.payload;
    },
    addFavorite: (state, action: PayloadAction<string>) => {
      if (!state.favorites.includes(action.payload)) {
        state.favorites.push(action.payload);
      }
    },
    removeFavorite: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter(id => id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// Thunks
export const fetchFavorites = () => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      dispatch(setFavorites([]));
      return;
    }

    const { data: favorites } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', user.id);

    dispatch(setFavorites(favorites?.map(f => f.product_id) || []));
  } catch (error: any) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const toggleFavorite = (productId: string) => async (dispatch: any, getState: () => any) => {
  const state = getState();
  const isFavorited = state.favorites.favorites.includes(productId);
  
  // Optimistic update
  if (isFavorited) {
    dispatch(removeFavorite(productId));
  } else {
    dispatch(addFavorite(productId));
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("You must be logged in to modify favorites");
    }

    if (isFavorited) {
      const { data: favoriteRecord } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (favoriteRecord?.id) {
        await supabase.from('favorites').delete().eq('id', favoriteRecord.id);
      }
    } else {
      await supabase.from('favorites').insert({
        user_id: user.id,
        product_id: productId,
      });
    }
  } catch (error: any) {
    // Revert on error
    if (isFavorited) {
      dispatch(addFavorite(productId));
    } else {
      dispatch(removeFavorite(productId));
    }
    dispatch(setError(error.message));
    throw error;
  }
};

export const { setFavorites, addFavorite, removeFavorite, setLoading, setError } = favoritesSlice.actions;

export default favoritesSlice.reducer; 