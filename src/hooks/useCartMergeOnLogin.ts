"use client"

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCartState } from "src/store/features/cartSlice";
import { mergeCartItems } from "src/utils/cartMerge";
import { getUserCartFromSupabase, saveCartToSupabase } from "src/utils/cartApi"; 
import { RootState } from "src/store";

export function useCartMergeOnLogin(user: User | null) {
  const dispatch = useDispatch();
  const localCart = useSelector((state: RootState) => state.cart.items);

  useEffect(() => {
    if (!user) return;

    (async () => {
      // Fetch remote cart
      const remoteCart = await getUserCartFromSupabase(user.id);

      //  Merge
      const mergedItems = mergeCartItems(localCart, remoteCart);

      // Save to Supabase
      await saveCartToSupabase(user.id, mergedItems);

      //  Update redux/localStorage
      dispatch(setCartState({ items: mergedItems }));

      //  Optionally clear localStorage
      localStorage.removeItem("cart");
    })();
  }, [user]);
}