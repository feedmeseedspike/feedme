"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { addItem } from "src/store/features/browsingHistorySlice";
import { createClient } from "src/utils/supabase/client";

export default function AddToBrowsingHistory({
  id,
  category,
}: {
  id: string;
  category: string[];
}) {
  const dispatch = useDispatch();

  useEffect(() => {
    const addProductToHistory = async () => {
      // Add to Redux store (for immediate client-side use)
      dispatch(addItem({ id, category: category[0] }));

      // Add to Supabase (for persistent storage and recommendations)
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from("browsing_history").insert([
          {
            user_id: user.id,
            product_id: id,
          },
        ]);

        if (error) {
          console.error("Error adding to browsing history:", error);
        }
      }
    };

    addProductToHistory();
  }, [dispatch, id, category]);
  // // console.log(addItem({ id, category }))

  return null;
}
