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
};

export type GetCartSuccess = { success: true; data: CartItem[]; error: null };
export type GetCartFailure = { success: false; data: null; error: string };

// Helper function to get or create a user's cart
async function getUserCartId(userId: string) {
  const supabase = await createClient();
  // Prefer the earliest created cart for this user to avoid multiple-row errors
  const { data: carts, error } = await supabase
    .from("cart")
    .select("id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw error;
  }

  if (carts && carts.length > 0) {
    return carts[0].id as string;
  }

  // If no cart exists, create one
  const { data: newCart, error: insertError } = await supabase
    .from("cart")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }
  return newCart!.id as string;
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

    console.log("Form data inserted:", formData);

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

    const { data, error } = await supabase
      .from("cart_items")
      .select("*, products(*), bundles(*), offers(*)") // Select cart item fields and join with products, bundles, and offers
      .eq("cart_id", cartId) // Use cart_id instead of user_id
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Map the fetched data to the CartItem type, ensuring the option field is correctly typed
    const typedData: CartItem[] = (data || []).map((item) => ({
      ...item,
      products: item.products,
      bundles: item.bundles, // Map bundles data
      offers: item.offers, // Map offers data
    }));

    // Debug logging removed

    return { success: true, data: typedData, error: null };
  } catch (error: any) {
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

    // Call the RPC function to update cart items
    const { error } = await supabase.rpc("update_cart_items", {
      p_cart_id: cartId,
      p_new_items: items as any, // Cast to any because Json type might not perfectly match
    });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
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
  offerId?: string | null
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
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

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
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

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
        .select("id, price, options") // Select price and options
        .eq("id", productId)
        .limit(1)
        .maybeSingle();

      if (productFetchError) throw productFetchError;
      
      // If not a product, it might actually be a bundle id coming from AI – handle gracefully
      if (!productData) {
        const { data: bundleData, error: bundleFetchError } = await supabase
          .from("bundles")
          .select("id, price")
          .eq("id", productId)
          .limit(1)
          .maybeSingle();

        if (bundleFetchError) throw bundleFetchError;
        if (bundleData) {
          // Treat as bundle add
          const { data: existingBundleItem, error: fetchError } = await supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("cart_id", cartId)
            .eq("bundle_id", bundleData.id)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (fetchError && (fetchError as any).code !== "PGRST116") throw fetchError;

          if (existingBundleItem) {
            const { error: updateError } = await supabase
              .from("cart_items")
              .update({ quantity: existingBundleItem.quantity + quantity })
              .eq("id", existingBundleItem.id);
            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from("cart_items")
              .insert({
                cart_id: cartId,
                bundle_id: bundleData.id,
                quantity: quantity,
                price: bundleData.price,
                product_id: null,
              });
            if (insertError) throw insertError;
          }
          return { success: true };
        }
        // Neither product nor bundle found
        throw new Error("Product not found.");
      }

      const { data: existingItems, error: fetchError } = await supabase
        .from("cart_items")
        .select("id, quantity, option") // Select option to compare
        .eq("cart_id", cartId)
        .eq("product_id", productId)
        .is("bundle_id", null); // Ensure it's not a bundle item

      if (fetchError) throw fetchError;

      // Find the existing item with the exact same option JSON structure
      const existingItem = existingItems?.find(
        (cartItem) =>
          JSON.stringify(cartItem.option || null) ===
          JSON.stringify(selectedOption || null)
      );

      // Determine the price to use: option price if available, otherwise product base price
      const itemPrice =
        (selectedOption as unknown as ProductOption | null)?.price ??
        productData.price;

      if (existingItem) {
        // If product item exists, update the quantity and potentially the option/price if they changed (though option comparison should prevent this for now)
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({
            quantity: existingItem.quantity + quantity,
            price: itemPrice,
            option: (selectedOption as Json) || null,
          })
          .eq("id", existingItem.id);

        if (updateError) throw updateError;
      } else {
        // If product item does not exist, insert a new item
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cartId,
            product_id: productId,
            quantity: quantity,
            bundle_id: null, // Explicitly null for product items
            option: (selectedOption as Json) || null, // Store the selected option, or null if none
            price: itemPrice, // Store the calculated price
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

    // Get the cart item to check if it's an offer
    const { data: cartItem, error: fetchError } = await supabase
      .from("cart_items")
      .select("offer_id")
      .eq("id", cartItemId)
      .eq("cart_id", cartId)
      .single();

    if (fetchError) throw fetchError;
    if (!cartItem) throw new Error("Cart item not found");

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
      .eq("cart_id", cartId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to clear cart" };
  }
}
