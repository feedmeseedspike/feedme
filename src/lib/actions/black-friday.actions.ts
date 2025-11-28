"use server";

import { createClient } from "@utils/supabase/server";
import { Database, Tables } from "src/utils/database.types";

type BlackFridayRow = Tables<"black_friday_items">;

export async function getBlackFridayItems(options?: {
  includeInactive?: boolean;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("black_friday_items")
    .select(
      `*,
      products (*)
    `
    )
    .order("created_at", { ascending: false });

  if (!options?.includeInactive) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}

export async function getActiveBlackFridayItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("black_friday_items")
    .select(
      `*,
      products (*)
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createBlackFridayItem(
  payload: Database["public"]["Tables"]["black_friday_items"]["Insert"]
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("black_friday_items")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBlackFridayItem(
  payload: Database["public"]["Tables"]["black_friday_items"]["Update"]
) {
  if (!payload.id) {
    throw new Error("Black Friday item ID is required for update.");
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("black_friday_items")
    .update(payload)
    .eq("id", payload.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBlackFridayItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("black_friday_items")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { success: true };
}



