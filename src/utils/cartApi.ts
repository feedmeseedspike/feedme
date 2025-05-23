import { createClient } from "src/utils/supabase/client";
import { OrderItem } from "src/types";

// Fetch the user's cart from Supabase
export async function getUserCartFromSupabase(userId: string): Promise<OrderItem[]> {
  const supabase = createClient();

  // 1. Find the user's cart
  const { data: cartData, error: cartError } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (cartError || !cartData) {
    // No cart found for the user
    console.log("No cart found for user:", userId);
    return [];
  }

  const cartId = cartData.id;

  // 2. Fetch items for that cart ID and join with products and vendors to get necessary details
  const { data: itemsData, error: itemsError } = await supabase
    .from("cart_items")
    .select(
      `
      product_id,
      option,
      quantity,
      price,
      products (
        name,
        slug,
        category_ids,
        images,
        count_in_stock,
        vendor_id,
        vendors (id, "shopId", "displayName", logo) // Join with vendors table
      )
    `
    )
    .eq("cart_id", cartId);

  if (itemsError) {
    console.error("Error fetching cart items:", itemsError);
    return [];
  }

  const items: OrderItem[] = itemsData.map((item: any) => ({
    clientId: `${item.product_id}-${item.option?.name || "no-option"}`,
    product: item.product_id,
    name: item.products?.name || "",
    slug: item.products?.slug || "",
    category: item.products?.category_ids?.[0] || "", 
    image: item.products?.images?.[0] || "", 
    price: item.price,
    vendor: {
      id: item.products?.vendors?.id || "",
      shopId: item.products?.vendors?.shopId || "",
      displayName: item.products?.vendors?.displayName || "",
      logo: item.products?.vendors?.logo || undefined,
    },
    countInStock: item.products?.count_in_stock || 0,
    options: [],
    selectedOption: item.option?.name || null,
    option: item.option || undefined,
  }));

  console.log("Fetched cart items:", items);
  return items;
}

// Save the merged cart to Supabase
export async function saveCartToSupabase(userId: string, items: OrderItem[]) {
  const supabase = createClient();

  // 1. Find or create the user's cart
  let cartId: string;
  const { data: existingCart, error: fetchError } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
     console.error("Error fetching existing cart:", fetchError);
     throw fetchError; // Re-throw other errors
  }

  if (existingCart) {
    cartId = existingCart.id;
    console.log("Existing cart found for user:", userId, "id:", cartId);
  } else {
    const { data: newCart, error: createError } = await supabase
      .from("cart")
      .insert([{ user_id: userId }])
      .select("id")
      .single();

    if (createError || !newCart) {
      console.error("Error creating new cart:", createError);
      throw createError; 
    }
    cartId = newCart.id;
    console.log("New cart created for user:", userId, "id:", cartId);
  }

  // 2. Get current items in the database for this cart
  const { data: currentItems, error: fetchItemsError } = await supabase
    .from("cart_items")
    .select("id, product_id, option, quantity")
    .eq("cart_id", cartId);

  if (fetchItemsError) {
    console.error("Error fetching current cart items for saving:", fetchItemsError);
    throw fetchItemsError;
  }

  const currentItemsMap = new Map(
    currentItems.map(item => {
      const itemKey = `${item.product_id}-${item.option?.name || "no-option"}`;
      return [itemKey, item];
    })
  );

  const incomingItemsMap = new Map(
    items.map(item => {
       const itemKey = `${item.product}-${item.selectedOption || "no-option"}`;
       return [itemKey, item];
    })
  );

  const itemsToInsert = [];
  const itemsToUpdate = [];
  const itemIdsToDelete = [];

  // Identify items to insert or update
  for (const [itemKey, incomingItem] of incomingItemsMap.entries()) {
    const existingItem = currentItemsMap.get(itemKey);
    if (existingItem) {
      // Item exists, check if quantity needs update
      if (existingItem.quantity !== incomingItem.quantity) {
        itemsToUpdate.push({
          id: existingItem.id,
          quantity: incomingItem.quantity
        });
      }
      // Remove from currentItemsMap as it's accounted for
      currentItemsMap.delete(itemKey);
    } else {
      // Item does not exist, prepare for insert
      itemsToInsert.push({
        cart_id: cartId,
        product_id: incomingItem.product,
        option: incomingItem.option || null,
        quantity: incomingItem.quantity,
        price: incomingItem.price, 
      });
    }
  }

  // Any remaining items in currentItemsMap need to be deleted
  for (const [itemKey, existingItem] of currentItemsMap.entries()) {
    itemIdsToDelete.push(existingItem.id);
  }

  // Perform database operations
  const operations = [];

  if (itemsToInsert.length > 0) {
    operations.push(supabase.from("cart_items").insert(itemsToInsert));
    console.log("Inserting items:", itemsToInsert);
  }

  if (itemsToUpdate.length > 0) {
    // Perform updates individually 
    for (const updateItem of itemsToUpdate) {
       operations.push(supabase.from("cart_items").update({ quantity: updateItem.quantity }).eq("id", updateItem.id));
       console.log("Updating item id", updateItem.id, "quantity to", updateItem.quantity);
    }
  }

  if (itemIdsToDelete.length > 0) {
    operations.push(supabase.from("cart_items").delete().in("id", itemIdsToDelete));
    console.log("Deleting item ids:", itemIdsToDelete);
  }

  // Execute all operations
  const results = await Promise.all(operations);

  // Check for errors in operations
  for (const result of results) {
    if (result.error) {
      console.error("Error during cart save operation:", result.error);
      throw result.error; 
    }
  }

  console.log("Cart saved successfully for user:", userId);
}

// You might also need a function to remove items from the cart
export async function removeCartItemFromSupabase(userId: string, productId: string, selectedOption?: string | null) {
  const supabase = createClient();

  // 1. Find the user's cart
  const { data: cartData, error: cartError } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (cartError || !cartData) {
    console.error("Cart not found for user:", userId, "when removing item.", cartError);
    return; 
  }

  const cartId = cartData.id;

  // 2. Find and delete the specific cart item
  let query = supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cartId)
    .eq("product_id", productId);

  // Match based on the option name if provided, otherwise match items with no option
  if (selectedOption !== undefined && selectedOption !== null) {
    query = query.eq("option->>name", selectedOption);
  } else {
      query = query.is("option", null);
  }

  const { error } = await query;

  if (error) {
    console.error("Error removing cart item:", error);
    throw error; 
  } else {
    console.log("Item removed successfully from cart.");
  }
}

// You might also need a function to update item quantity directly
export async function updateCartItemQuantityInSupabase(userId: string, productId: string, quantity: number, selectedOption?: string | null) {
  const supabase = createClient();

  // 1. Find the user's cart
  const { data: cartData, error: cartError } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (cartError || !cartData) {
    console.error("Cart not found for user:", userId, "when updating item quantity.", cartError);
    return; // Or throw an error
  }

  const cartId = cartData.id;

  // 2. Find the specific cart item and update quantity
  let query = supabase
    .from("cart_items")
    .update({ quantity: quantity })
    .eq("cart_id", cartId)
    .eq("product_id", productId);

   // Match based on the option name if provided, otherwise match items with no option
   if (selectedOption !== undefined && selectedOption !== null) {
    query = query.eq("option->>name", selectedOption);
  } else {
      query = query.is("option", null);
  }

  const { error } = await query;

  if (error) {
    console.error("Error updating cart item quantity:", error);
    throw error;
  } else {
    console.log("Item quantity updated successfully in Supabase.");
  }
}

// Add a function to clear the cart in Supabase
export async function clearCartInSupabase(userId: string) {
  const supabase = createClient();

  // 1. Find the user's cart
  const { data: cartData, error: cartError } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (cartError || !cartData) {
    console.error("Cart not found for user:", userId, "when clearing cart.", cartError);
    return; // Or throw an error
  }

  const cartId = cartData.id;

  // 2. Delete all items associated with the cart ID
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cartId);

  if (error) {
    console.error("Error clearing cart items:", error);
    throw error; 
  } else {
    console.log("Cart cleared successfully in Supabase.");
  }
}