"use server";

import { createClient } from "src/utils/supabase/server";
import { Json } from "src/utils/database.types";

/** Helper: get or create the cart ID for a user */
async function getUserCartId(userId: string): Promise<string> {
  const supabase = await createClient();

  let { data: cart, error } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  if (!cart) {
    const { data: newCart, error: insertError } = await supabase
      .from("cart")
      .insert({ user_id: userId })
      .select("id")
      .single();
    if (insertError) throw insertError;
    cart = newCart;
  }

  return (cart as any).id;
}

export interface SharedCartItem {
  product_id: string | null;
  bundle_id: string | null;
  offer_id: string | null;
  quantity: number;
  price: number | null;
  option: Json | null;
  black_friday_item_id: string | null;
  name: string;
  image: string | null;
  slug: string | null;
}

export type CreateSharedCartSuccess = { success: true; token: string; url: string };
export type CreateSharedCartFailure = { success: false; error: string };

/**
 * Snapshot the current user's cart and persist it to `shared_carts`.
 * Returns a shareable URL valid for 30 days.
 * Free-prize items (price === 0) are excluded from the snapshot.
 */
export async function createSharedCart(): Promise<
  CreateSharedCartSuccess | CreateSharedCartFailure
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "You must be logged in to share your cart.",
    };
  }

  try {
    const cartId = await getUserCartId(user.id);

    const { data: cartItems, error: fetchError } = await supabase
      .from("cart_items")
      .select(
        `*, 
         products(id, name, slug, images, price),
         bundles(id, name, thumbnail_url, price),
         offers(id, title, image_url, price_per_slot)`
      )
      .eq("cart_id", cartId)
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;

    // Exclude free prize items (price === 0 or null)
    const shareable = (cartItems || []).filter(
      (item: any) => item.price && Number(item.price) > 0
    );

    if (shareable.length === 0) {
      return {
        success: false,
        error: "Your cart is empty. Add some items before sharing.",
      };
    }

    const snapshot: SharedCartItem[] = shareable.map((item: any) => ({
      product_id: item.product_id ?? null,
      bundle_id: item.bundle_id ?? null,
      offer_id: item.offer_id ?? null,
      quantity: item.quantity,
      price: item.price ?? null,
      option: item.option ?? null,
      black_friday_item_id: item.black_friday_item_id ?? null,
      name:
        item.products?.name ||
        item.bundles?.name ||
        item.offers?.title ||
        "Product",
      image:
        item.products?.images?.[0] ||
        item.bundles?.thumbnail_url ||
        item.offers?.image_url ||
        null,
      slug: item.products?.slug ?? null,
    }));

    const { data, error: insertError } = await supabase
      .from("shared_carts")
      .insert({ user_id: user.id, items: snapshot as unknown as Json })
      .select("token")
      .single();

    if (insertError) throw insertError;

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://feedme.ng";

    return {
      success: true,
      token: (data as any).token,
      url: `${baseUrl}/shared-cart/${(data as any).token}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create shared cart.",
    };
  }
}

export type GetSharedCartSuccess = {
  success: true;
  items: SharedCartItem[];
  createdAt: string;
};
export type GetSharedCartFailure = { success: false; error: string };

/**
 * Fetch a shared cart snapshot by its token.
 * Public — no authentication required.
 */
export async function getSharedCart(
  token: string
): Promise<GetSharedCartSuccess | GetSharedCartFailure> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("shared_carts")
      .select("items, created_at, expires_at")
      .eq("token", token)
      .single();

    if (error || !data) {
      return { success: false, error: "Shared cart not found or has expired." };
    }

    const now = new Date();
    if (
      (data as any).expires_at &&
      new Date((data as any).expires_at) < now
    ) {
      return { success: false, error: "This shared cart link has expired." };
    }

    const rawItems = (data as any).items as SharedCartItem[];
    // Second layer of protection: filter out any free prize items that might have been snapshotted
    const filteredItems = rawItems.filter(
      (item: any) => item.price && Number(item.price) > 0
    );

    return {
      success: true,
      items: filteredItems,
      createdAt: (data as any).created_at,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to load shared cart.",
    };
  }
}
