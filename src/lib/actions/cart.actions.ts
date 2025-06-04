"use server";

import { createClient } from "src/utils/supabase/server";
import { Tables, Json } from "src/utils/database.types";

// Define ProductOption interface based on usage in add-to-cart.tsx
export interface ProductOption {
  name: string;
  price: number;
  image?: string;
  stockStatus?: string;
}

// Define a more explicit CartItem type including joined tables
export type CartItem = Tables<'cart_items'> & {
  products: Tables<'products'> | null; // Joined product data
  bundles: { id: string; name: string; discount_percentage: number | null; } | null; // Joined bundle data with selected fields
};

export type GetCartSuccess = { success: true; data: CartItem[]; error: null };
export type GetCartFailure = { success: false; data: null, error: string };

// Helper function to get or create a user's cart
async function getUserCartId(userId: string) {
  const supabase = await createClient();
  // Try to find existing cart
  let { data: cart, error } = await supabase
    .from('cart')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    throw error;
  }

  if (!cart) {
    // If no cart exists, create one
    const { data: newCart, error: insertError } = await supabase
      .from('cart')
      .insert({ user_id: userId })
      .select('id')
      .single();

    if (insertError) throw insertError;
    cart = newCart;
  }

  if (!cart) {
      throw new Error("Could not get or create user cart.");
  }

  return cart.id;
}

// Server action to fetch the user's cart
export async function getCart(): Promise<GetCartSuccess | GetCartFailure> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: true, data: [], error: null };
  }

  try {
    const cartId = await getUserCartId(user.id);

    const { data, error } = await supabase
      .from('cart_items')
      .select('*, products(*), bundles(id, name, discount_percentage)') // Select cart item fields and join with products and specific bundle fields
      .eq('cart_id', cartId) // Use cart_id instead of user_id
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Map the fetched data to the CartItem type, explicitly ensuring correct structure
    const typedData: CartItem[] = (data || []).map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      cart_id: item.cart_id,
      created_at: item.created_at,
      bundle_id: item.bundle_id,
      products: item.products, // products relationship is already typed
      bundles: item.bundles, // bundles relationship should now match the explicitly selected shape
      option: item.option, // option is Json | null from Tables<'cart_items'>
    }));

    return { success: true, data: typedData, error: null };

  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return { success: false, data: null, error: error.message || "Failed to fetch cart" };
  }
}

export type UpdateCartItemsSuccess = { success: true };
export type UpdateCartItemsFailure = { success: false; error: string };

// Define the structure of the items array expected by the update_cart_items function
export interface ItemToUpdate {
  product_id: string;
  option: Json | null;
  quantity: number;
  price: number; // Assuming price is also sent in the update array
  bundle_id?: string | null; // Add optional bundle_id
}

// Server action to update the entire cart using the update_cart_items function
export async function updateCartItems(items: ItemToUpdate[]): Promise<UpdateCartItemsSuccess | UpdateCartItemsFailure> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "You must be logged in to update your cart.",
    };
  }

  try {
    const cartId = await getUserCartId(user.id);

    // Call the RPC function to update cart items
    const { error } = await supabase.rpc('update_cart_items', {
      p_cart_id: cartId,
      p_new_items: items as any, // Cast to any because Json type might not perfectly match
    });

    if (error) throw error;

    return { success: true };

  } catch (error: any) {
    console.error('Error updating cart items:', error);
    return { success: false, error: error.message || "Failed to update cart items" };
  }
}

export type AddToCartSuccess = { success: true };
export type AddToCartFailure = { success: false; error: string };

// Server action to add an item to the cart
export async function addToCart(productId: string, quantity: number, selectedOption?: Tables<'products'>['options'] | null): Promise<AddToCartSuccess | AddToCartFailure> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
     return { 
      success: false, 
      error: "You must be logged in to add items to cart (anonymous cart coming soon)" 
    }; // Handle unauthenticated cart later
  }

  try {
    const cartId = await getUserCartId(user.id);

    // Fetch potential existing items for this product in the cart
    const { data: existingItems, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, quantity, option') // Select the option column
      .eq('cart_id', cartId)
      .eq('product_id', productId);

    if (fetchError) throw fetchError;

    // Find the existing item with the exact same option JSON structure
    const existingItem = existingItems?.find(
      (cartItem) =>
        JSON.stringify(cartItem.option || null) === JSON.stringify(selectedOption || null)
    );

    if (existingItem) {
      // If item exists, update the quantity
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);

      if (updateError) throw updateError;

    } else {
      // If item does not exist, insert a new item
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId, // Use cart_id
          product_id: productId,
          quantity: quantity,
          option: selectedOption, // Store the selected option object or null
        });

      if (insertError) throw insertError;
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return { success: false, error: error.message || "Failed to add to cart" };
  }
}

export type RemoveFromCartSuccess = { success: true };
export type RemoveFromCartFailure = { success: false; error: string };

// Server action to remove an item from the cart
export async function removeFromCart(cartItemId: string): Promise<RemoveFromCartSuccess | RemoveFromCartFailure> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
     return { 
      success: false, 
      error: "You must be logged in to modify cart (anonymous cart coming soon)" 
    }; // Handle unauthenticated cart later
  }

  try {
    const cartId = await getUserCartId(user.id);

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('cart_id', cartId); // Use cart_id instead of user_id

    if (error) throw error;

    return { success: true };

  } catch (error: any) {
    console.error('Error removing from cart:', error);
    return { success: false, error: error.message || "Failed to remove from cart" };
  }
}

export type UpdateCartItemQuantitySuccess = { success: true };
export type UpdateCartItemQuantityFailure = { success: false; error: string };

// Server action to update item quantity in the cart
export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<UpdateCartItemQuantitySuccess | UpdateCartItemQuantityFailure> {
   const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
     return { 
      success: false, 
      error: "You must be logged in to modify cart (anonymous cart coming soon)" 
    }; // Handle unauthenticated cart later
  }

  try {
    if (quantity <= 0) {
      // If quantity is 0 or less, remove the item
      return removeFromCart(cartItemId);
    }

    const cartId = await getUserCartId(user.id);

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: quantity })
      .eq('id', cartItemId)
      .eq('cart_id', cartId); // Use cart_id instead of user_id

    if (error) throw error;

    return { success: true };

  } catch (error: any) {
    console.error('Error updating cart item quantity:', error);
    return { success: false, error: error.message || "Failed to update cart item quantity" };
  }
}

export type ClearCartSuccess = { success: true };
export type ClearCartFailure = { success: false; error: string };

// Server action to clear the entire cart for a user
export async function clearCart(): Promise<ClearCartSuccess | ClearCartFailure> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
     return { 
      success: false, 
      error: "You must be logged in to clear cart (anonymous cart coming soon)" 
    }; // Handle unauthenticated cart later
  }

  try {
    const cartId = await getUserCartId(user.id);

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId); // Use cart_id instead of user_id

    if (error) throw error;

    return { success: true };

  } catch (error: any) {
    console.error('Error clearing cart:', error);
    return { success: false, error: error.message || "Failed to clear cart" };
  }
} 