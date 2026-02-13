"use server";

import { createClient } from "src/utils/supabase/server";
import { Tables, Json } from "src/utils/database.types";

// Define ProductOption interface based on usage in add-to-cart.tsx
export interface ProductOption {
  name?: string;
  price?: number;
  image?: string;
  stockStatus?: string;
}

// Update CartItem type to include product, bundle, and offer relationships
export type CartItem = Tables<"cart_items"> & {
  offer_id?: string | null; // Add offer_id property
  products: Tables<"products"> | null;
  bundles: Tables<"bundles"> | null;
  offers: Tables<"offers"> | null; // Add offers relationship
  black_friday_items: Tables<"black_friday_items"> | null;
  meta?: { name?: string; slug?: string; image?: string } | null;
};

export type GetCartSuccess = { success: true; data: CartItem[]; error: null };
export type GetCartFailure = { success: false; data: null; error: string };

// Helper function to get or create a user's cart
async function getUserCartId(userId: string) {
  const supabase = await createClient();
  // Try to find existing cart
  let { data: cart, error } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 means no rows found
    throw error;
  }

  if (!cart) {
    // If no cart exists, create one
    const { data: newCart, error: insertError } = await supabase
      .from("cart")
      .insert({ user_id: userId })
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }
    cart = newCart;
  }

  return cart.id;
}

// Server action to update the entire cart using the update_cart_items function
export async function sendOffers(data: {
  name: string;
  email: string;
  phone: string;
}) {
  const supabase = await createClient();
  try {
    const { data: formData, error } = await supabase
      .from("form")
      .insert([{ name: data.name, email: data.email, phone: data.phone }])
      .select();

    

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false };
  }
}

// Server action to fetch the user's cart
export async function getCart(): Promise<GetCartSuccess | GetCartFailure> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: true, data: [], error: null };
  }

  try {
    const cartId = await getUserCartId(user.id);

    // Fetch cart items - Supabase's default join is LEFT JOIN, so cart items are returned even if product doesn't exist
    // Use explicit LEFT JOIN syntax to avoid 400 errors with nested selects
    // Note: Supabase PostgREST may have issues with multiple nested selects, so we use a simpler approach
    const { data, error } = await supabase
      .from("cart_items")
      .select("*, products(*), bundles(*), offers(*), black_friday_items(*)")
      .eq("cart_id", cartId)
      .order("created_at", { ascending: true });

    if (error) {
      // Log the error for debugging
      console.error("Error fetching cart:", error);
      // If it's a query syntax error or relationship error, try a simpler query without nested selects
      const errorCode = (error as any).code;
      const errorStatus = (error as any).status;
      // PGRST200 = relationship not found, PGRST300 = syntax error, 400 = bad request, 22P02 = invalid input
      if (errorCode === "PGRST200" || errorCode === "PGRST300" || errorStatus === 400 || errorCode === "22P02") {
        // Fallback: fetch without joins and then fetch related data separately
        const { data: simpleData, error: simpleError } = await supabase
          .from("cart_items")
          .select("*")
          .eq("cart_id", cartId)
          .order("created_at", { ascending: true });

        if (simpleError) {
          throw simpleError;
        }

        // Map to CartItem format with null joins (we'll fetch them if needed)
        const typedData: CartItem[] = (simpleData || []).map((item: any) => ({
          ...item,
          products: null,
          bundles: null,
          offers: null,
          black_friday_items: null,
        }));

        return { success: true, data: typedData, error: null };
      }
      throw error;
    }

    // Map the fetched data to the CartItem type
    // Supabase returns joined data as objects (not arrays) when using the default syntax
    // Handle cases where the join might return null if the related record doesn't exist
    const typedData: CartItem[] = (data || []).map((item: any) => ({
      ...item,
      products: item.products || null,
      bundles: item.bundles || null,
      offers: item.offers || null,
      black_friday_items: item.black_friday_items || null,
    }));

    return { success: true, data: typedData, error: null };
  } catch (error: any) {
    console.error("Cart fetch error:", error);
    return {
      success: false,
      data: null,
      error: error.message || "Failed to fetch cart",
    };
  }
}

export type UpdateCartItemsSuccess = { success: true };
export type UpdateCartItemsFailure = { success: false; error: string };

// Define the structure of the items array expected by the update_cart_items function
export interface ItemToUpdate {
  product_id?: string | null;
  bundle_id?: string | null;
  offer_id?: string | null;
  black_friday_item_id?: string | null;
  option?: Json | null;
  quantity: number;
  price?: number | null;
}

// Server action to update the entire cart using the update_cart_items function
export async function updateCartItems(
  items: ItemToUpdate[]
): Promise<UpdateCartItemsSuccess | UpdateCartItemsFailure> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "ANONYMOUS_USER",
    };
  }

  try {
    const cartId = await getUserCartId(user.id);

    // SECURITY: Fetch current cart items to validate sensitive updates
    const { data: currentCartItems } = await supabase
      .from("cart_items")
      .select("product_id, bundle_id, offer_id, option, price, black_friday_item_id")
      .eq("cart_id", cartId);

    // Validate checks
    for (const item of items) {
        // Find matching item in DB
        const match = currentCartItems?.find(dbItem => {
             const sameProduct = (item.product_id ?? null) === (dbItem.product_id ?? null);
             const sameBundle = (item.bundle_id ?? null) === (dbItem.bundle_id ?? null);
             const sameOffer = (item.offer_id ?? null) === (dbItem.offer_id ?? null);
             const sameBF = (item.black_friday_item_id ?? null) === (dbItem.black_friday_item_id ?? null);
             
             const itemOpt = JSON.stringify(item.option || null);
             const dbOpt = JSON.stringify(dbItem.option || null);
             
             return sameProduct && sameBundle && sameOffer && sameBF && (itemOpt === dbOpt);
        });

        // Check 1: Existing free item quantity increase
        if (match && match.price === 0 && item.quantity > 1) {
             throw new Error("You cannot increase the quantity of a free prize item.");
        }
        
        // Check 2: New item attempting to be free with >1 qty (if creating via update - though usually create is addToCart)
        // If match is not found, update_cart_items often inserts. 
        // We shouldn't allow inserting 2 free items at once if we can help it.
        if (!match && item.price === 0 && item.quantity > 1) {
             throw new Error("Free prize items are limited to 1.");
        }
    }

    // Ensure all products have the correct structure for the RPC function
    // The RPC expects JSONB, so we need to ensure proper serialization
    const serializedItems = items.map((item) => ({
      product_id: item.product_id || null,
      bundle_id: item.bundle_id || null,
      offer_id: item.offer_id || null,
      black_friday_item_id: item.black_friday_item_id || null,
      option: item.option || null,
      quantity: item.quantity,
      price: item.price || null,
    }));

    // Call the RPC function to update cart items
    const { error } = await supabase.rpc("update_cart_items", {
      p_cart_id: cartId,
      p_new_items: serializedItems as any, // Cast to any because Json type might not perfectly match
    });

    if (error) {
      console.error("RPC error updating cart:", error);
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateCartItems:", error);
    return {
      success: false,
      error: error.message || "Failed to update cart items",
    };
  }
}

export type AddToCartSuccess = { success: true };
export type AddToCartFailure = { success: false; error: string };

// Server action to add an item to the cart
export async function addToCart(
  productId: string | null,
  quantity: number,
  selectedOption?: Tables<"products">["options"] | null,
  bundleId?: string | null,
  offerId?: string | null,
  blackFridayItemId?: string | null,
  customPrice?: number | null
): Promise<AddToCartSuccess | AddToCartFailure> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // For anonymous users, we'll handle this on the client side
    return {
      success: false,
      error: "ANONYMOUS_USER",
    };
  }

  try {
    const cartId = await getUserCartId(user.id);

    if (bundleId) {
      // Handle adding a bundle to cart
      const { data: existingBundleItem, error: fetchError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("bundle_id", bundleId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      if (existingBundleItem) {
        // If bundle item exists, update its quantity
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity: existingBundleItem.quantity + quantity })
          .eq("id", existingBundleItem.id);

        if (updateError) throw updateError;
      } else {
        // Fetch bundle details to get price and other info for the cart item
        const { data: bundleData, error: bundleFetchError } = await supabase
          .from("bundles")
          .select("id, name, price")
          .eq("id", bundleId)
          .single();

        if (bundleFetchError) throw bundleFetchError;
        if (!bundleData) throw new Error("Bundle not found.");

        // Insert new bundle item into cart_items
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cartId,
            bundle_id: bundleId,
            quantity: quantity,
            price: bundleData.price, // Use bundle's price
            product_id: null, // No product_id for bundle items
          });

        if (insertError) throw insertError;
      }
    } else if (offerId) {
      // Debug logging removed
      // Handle adding an offer to cart
      const { data: existingOfferItem, error: fetchError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("offer_id", offerId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      if (existingOfferItem) {
        // Fetch offer details to validate availability for quantity update
        const { data: offerData, error: offerFetchError } = await supabase
          .from("offers")
          .select("available_slots, title")
          .eq("id", offerId)
          .single();

        if (offerFetchError) throw offerFetchError;
        if (!offerData) throw new Error("Offer not found.");

        const newTotalQuantity = existingOfferItem.quantity + quantity;

        // Debug logging removed

        // Check if the new total quantity exceeds available slots
        if (newTotalQuantity > offerData.available_slots) {
          throw new Error(
            `Only ${offerData.available_slots} slots available for "${offerData.title}". You currently have ${existingOfferItem.quantity} in cart.`
          );
        }

        // If offer item exists, update its quantity
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity: newTotalQuantity })
          .eq("id", existingOfferItem.id);

        if (updateError) throw updateError;
      } else {
        // Fetch offer details to get price and other info for the cart item
        const { data: offerData, error: offerFetchError } = await supabase
          .from("offers")
          .select("id, title, price_per_slot, available_slots")
          .eq("id", offerId)
          .single();

        if (offerFetchError) throw offerFetchError;
        if (!offerData) throw new Error("Offer not found.");

        // Check if there are enough slots available
        if (quantity > offerData.available_slots) {
          throw new Error(`Only ${offerData.available_slots} slots available.`);
        }

        // Insert new offer item into cart_items
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cartId,
            offer_id: offerId,
            quantity: quantity,
            price: offerData.price_per_slot, // Use offer's price per slot
            product_id: null, // No product_id for offer items
            bundle_id: null, // No bundle_id for offer items
          });

        if (insertError) throw insertError;
      }
    } else if (productId) {
      // Fetch product details to get its base price and available options
      const { data: productData, error: productFetchError } = await supabase
        .from("products")
        .select("id, price, options")
        .eq("id", productId)
        .single();

      if (productFetchError) throw productFetchError;
      if (!productData) throw new Error("Product not found.");

      let blackFridayItem: Tables<"black_friday_items"> | null = null;
      if (blackFridayItemId) {
        const { data: bfData, error: bfError } = await supabase
          .from("black_friday_items")
          .select("*")
          .eq("id", blackFridayItemId)
          .eq("product_id", productId)
          .single();

        if (bfError) throw bfError;
        if (!bfData) {
          throw new Error("Black Friday offer not found.");
        }
        const now = new Date();
        if (bfData.status !== "active") {
          throw new Error("This Black Friday offer is no longer active.");
        }
        if (bfData.start_at && new Date(bfData.start_at) > now) {
          throw new Error("This Black Friday offer is not yet available.");
        }
        if (bfData.end_at && new Date(bfData.end_at) < now) {
          throw new Error("This Black Friday offer has ended.");
        }
        blackFridayItem = bfData;
      }

      const { data: existingItems, error: fetchError } = await supabase
        .from("cart_items")
        .select("id, quantity, option, black_friday_item_id, price")
        .eq("cart_id", cartId)
        .eq("product_id", productId)
        .is("bundle_id", null);

      if (fetchError) throw fetchError;

      const existingItem = existingItems?.find(
        (cartItem) =>
          JSON.stringify(cartItem.option || null) ===
            JSON.stringify(selectedOption || null) &&
          (cartItem.black_friday_item_id ?? null) ===
            (blackFridayItemId ?? null)
      );

      const nextQuantity = (existingItem?.quantity ?? 0) + quantity;
      if (blackFridayItem) {
        const perUserLimit =
          blackFridayItem.max_quantity_per_user ??
          blackFridayItem.quantity_limit ??
          null;
        if (perUserLimit && nextQuantity > perUserLimit) {
          throw new Error(
            `You can only purchase ${perUserLimit} of this Black Friday item.`
          );
        }
        if (
          blackFridayItem.available_slots &&
          nextQuantity > blackFridayItem.available_slots
        ) {
          throw new Error(
            `Only ${blackFridayItem.available_slots} of this Black Friday item remain.`
          );
        }
      }

      const itemPrice =
        customPrice !== undefined && customPrice !== null ? customPrice :
        blackFridayItem?.new_price ??
        (selectedOption as unknown as ProductOption | null)?.price ??
        productData.price;

      if (existingItem) {
        // SECURITY CHECK: Do not allow modifying a Free Prize item via AddToCart
        if (existingItem.price === 0) {
            throw new Error("You have this item as a free prize. You cannot add more to it.");
        }

        const { error: updateError } = await supabase
          .from("cart_items")
          .update({
            quantity: nextQuantity,
            price: itemPrice,
            option: (selectedOption as Json) || null,
            black_friday_item_id: blackFridayItemId ?? null,
          })
          .eq("id", existingItem.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cartId,
            product_id: productId,
            quantity: quantity,
            bundle_id: null,
            option: (selectedOption as Json) || null,
            price: itemPrice,
            black_friday_item_id: blackFridayItemId ?? null,
          });

        if (insertError) throw insertError;
      }
    } else {
      // Neither productId, bundleId, nor offerId was provided
      return {
        success: false,
        error: "No product, bundle, or offer ID provided.",
      };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add to cart" };
  }
}

export type RemoveFromCartSuccess = { success: true };
export type RemoveFromCartFailure = { success: false; error: string };

// Server action to remove an item from the cart
export async function removeFromCart(
  cartItemId: string
): Promise<RemoveFromCartSuccess | RemoveFromCartFailure> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "ANONYMOUS_USER",
    };
  }

  try {
    const cartId = await getUserCartId(user.id);

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId)
      .eq("cart_id", cartId); // Use cart_id instead of user_id

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to remove from cart",
    };
  }
}

export type UpdateCartItemQuantitySuccess = { success: true };
export type UpdateCartItemQuantityFailure = { success: false; error: string };

// Server action to update item quantity in the cart
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
): Promise<UpdateCartItemQuantitySuccess | UpdateCartItemQuantityFailure> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "ANONYMOUS_USER",
    };
  }

  try {
    if (quantity <= 0) {
      // If quantity is 0 or less, remove the item
      return removeFromCart(cartItemId);
    }

    const cartId = await getUserCartId(user.id);

    // Get the cart item to check if it's an offer or prize
    const { data: cartItem, error: fetchError } = await supabase
      .from("cart_items")
      .select("offer_id, price") 
      .eq("id", cartItemId)
      .eq("cart_id", cartId)
      .single();

    if (fetchError) throw fetchError;
    if (!cartItem) throw new Error("Cart item not found");

    // VALIDATION: Prize Items (Price 0) cannot be increased
    if (cartItem.price === 0 && quantity > 1) {
        throw new Error("You cannot increase the quantity of a free prize item.");
    }

    // If this is an offer, validate availability
    if (cartItem.offer_id) {
      const { data: offerData, error: offerError } = await supabase
        .from("offers")
        .select("available_slots, status, title")
        .eq("id", cartItem.offer_id)
        .single();

      if (offerError) throw offerError;
      if (!offerData) throw new Error("Offer not found");

      if (offerData.status !== "active") {
        throw new Error(`Offer "${offerData.title}" is no longer active`);
      }

      if (quantity > offerData.available_slots) {
        throw new Error(
          `Only ${offerData.available_slots} slots available for "${offerData.title}"`
        );
      }
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: quantity })
      .eq("id", cartItemId)
      .eq("cart_id", cartId); // Use cart_id instead of user_id

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update cart item quantity",
    };
  }
}

export type ClearCartSuccess = { success: true };
export type ClearCartFailure = { success: false; error: string };

// Server action to clear the entire cart for a user
export async function clearCart(): Promise<
  ClearCartSuccess | ClearCartFailure
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "ANONYMOUS_USER",
    };
  }

  try {
    const cartId = await getUserCartId(user.id);

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId); // Use cart_id instead of user_id

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to clear cart" };
  }
}
