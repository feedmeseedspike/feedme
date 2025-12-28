"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  CartItem,
  GetCartSuccess,
  GetCartFailure,
  AddToCartSuccess,
  AddToCartFailure,
  RemoveFromCartSuccess,
  RemoveFromCartFailure,
  UpdateCartItemQuantitySuccess,
  UpdateCartItemQuantityFailure,
  ClearCartSuccess,
  ClearCartFailure,
  UpdateCartItemsSuccess,
  UpdateCartItemsFailure,
  updateCartItems,
  ProductOption,
} from "src/lib/actions/cart.actions";

// Import Tables and Json types from database.types.ts
import { Tables, Json } from "src/utils/database.types";
import { createClient } from "@utils/supabase/client";
import { useEffect } from "react";

// Query key for the cart
export const cartQueryKey = ['cart'];

// Hook to fetch the user's cart
export const useCartQuery = () => {
  return useQuery<CartItem[], GetCartFailure>({
    queryKey: cartQueryKey,
    queryFn: async () => {
      const result = await getCart();
      if (!result.success) {
        return []; 
      }
      return result.data;
    },
    staleTime: 0, // Always refetch when invalidated
    gcTime: 1000 * 60 * 30, // Cache is kept for 30 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

// Define the structure of items for the update mutation
export interface ItemToUpdateMutation {
  product_id?: string | null; // Make optional and allow null
  bundle_id?: string | null; // Add optional bundle_id
  offer_id?: string | null; // Add optional offer_id
  black_friday_item_id?: string | null;
  option?: Json | null; // Changed to Json | null (removed undefined possibility)
  quantity: number;
  price?: number | null; // Make optional
}

// Hook to update the entire cart
export const useUpdateCartMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateCartItemsSuccess | UpdateCartItemsFailure,
    Error,
    ItemToUpdateMutation[],
    { previousCart: CartItem[] | undefined }
  >({
    mutationFn: (items) => {
      return updateCartItems(items);
    },
    onMutate: async (newItems) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      
      // Snapshot the previous value - use the latest data from the query cache
      const previousCart = queryClient.getQueryData<CartItem[]>(cartQueryKey);
      // Ensure we have an array, even if it's empty
      const currentCart = Array.isArray(previousCart) ? previousCart : [];
      
      // Replace the cart with newItems, matching existing items to preserve IDs
      // Use a Set to track processed items and prevent duplicates
      const updatedCart: CartItem[] = [];
      const processedKeys = new Set<string>();
      
      for (const newItem of newItems) {
        // Create a unique key for this item
        const itemKey = `${newItem.product_id || ''}-${newItem.bundle_id || ''}-${newItem.offer_id || ''}-${newItem.black_friday_item_id || ''}-${JSON.stringify(newItem.option || null)}`;
        
        // Skip if we've already processed this item (prevent duplicates)
        if (processedKeys.has(itemKey)) {
          console.warn('Duplicate item in mutation array, skipping:', itemKey);
          continue;
        }
        processedKeys.add(itemKey);
        
        // Find existing item by matching product/bundle/offer + option + black_friday_item_id
        // CRITICAL: For bundles, we only match by bundle_id (no option/blackfriday needed)
        // For products, we match by product_id + option + black_friday
        const existingItem = currentCart.find((item) => {
          // For bundles: match ONLY by bundle_id (bundles don't have options)
          if (newItem.bundle_id !== null && newItem.bundle_id !== undefined) {
            return item.bundle_id === newItem.bundle_id && item.bundle_id !== null;
          }
          
          // For products: match by product_id + option + black_friday
          if (newItem.product_id !== null && newItem.product_id !== undefined) {
            const sameProduct = item.product_id === newItem.product_id;
            const itemBlackFridayId = (item as any).black_friday_item_id ?? null;
            const newItemBlackFridayId = newItem.black_friday_item_id ?? null;
            const sameBlackFriday = itemBlackFridayId === newItemBlackFridayId;
            const sameOption = JSON.stringify(item.option || null) === JSON.stringify(newItem.option || null);
            return sameProduct && sameBlackFriday && sameOption;
          }
          
          // For offers: match by offer_id + option + black_friday
          if (newItem.offer_id !== null && newItem.offer_id !== undefined) {
            const sameOffer = item.offer_id === newItem.offer_id;
            const itemBlackFridayId = (item as any).black_friday_item_id ?? null;
            const newItemBlackFridayId = newItem.black_friday_item_id ?? null;
            const sameBlackFriday = itemBlackFridayId === newItemBlackFridayId;
            const sameOption = JSON.stringify(item.option || null) === JSON.stringify(newItem.option || null);
            return sameOffer && sameBlackFriday && sameOption;
          }
          
          return false;
        });
        
        if (existingItem) {
          // Update existing item
          updatedCart.push({ 
            ...existingItem, 
            quantity: newItem.quantity,
            price: newItem.price ?? existingItem.price ?? 0
          });
        } else {
          // New item
          const firstExistingItem = currentCart.length > 0 ? currentCart[0] : null;
          updatedCart.push({
            id: `temp-${Date.now()}-${Math.random()}`,
            product_id: newItem.product_id,
            bundle_id: newItem.bundle_id,
            offer_id: newItem.offer_id,
            black_friday_item_id: newItem.black_friday_item_id ?? null,
            option: newItem.option,
            quantity: newItem.quantity,
            price: newItem.price || 0,
            cart_id: firstExistingItem?.cart_id || '',
            created_at: new Date().toISOString(),
            products: null,
            bundles: null,
            offers: null,
          } as CartItem);
        }
      }
      
      // Replace entire cart
      queryClient.setQueryData<CartItem[]>(cartQueryKey, updatedCart);
      
      return { previousCart };
    },
    onSuccess: async (data) => {
      // Refetch the cart query to get the correct state from the server
      // Use a delay to ensure the database transaction has fully committed
      // The optimistic update will keep the UI responsive until the refetch completes
      setTimeout(async () => {
        // Use refetchQueries instead of invalidateQueries to ensure we get fresh data
        // and can handle errors gracefully
        try {
          await queryClient.refetchQueries({ queryKey: cartQueryKey });
        } catch (error) {
          // If refetch fails, invalidate to trigger a refetch on next access
          console.error('Failed to refetch cart:', error);
          queryClient.invalidateQueries({ queryKey: cartQueryKey });
        }
      }, 500);
    },
    onError: (error, variables, context) => {
      // Revert to previous cart on error
      if (context?.previousCart) {
        queryClient.setQueryData<CartItem[]>(cartQueryKey, context.previousCart);
      }
    },
  });
};

// Hook to add an item to the cart
export const useAddToCartMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    AddToCartSuccess | AddToCartFailure,
    Error,
    { product_id?: string; bundle_id?: string; offer_id?: string; quantity: number; option?: Json },
    { previousCart: CartItem[] | undefined }
  >({
    mutationFn: (item) => addToCart(
      item.product_id || null,
      item.quantity,
      item.option || null,
      item.bundle_id || null,
      item.offer_id || null,
      null // blackFridayItemId
    ),
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
  });
};

// Hook to update cart item quantity
export const useUpdateCartItemQuantityMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    UpdateCartItemQuantitySuccess | UpdateCartItemQuantityFailure,
    Error,
    { cartItemId: string; quantity: number },
    { previousCart: CartItem[] | undefined }
  >({
    mutationFn: ({ cartItemId, quantity }) => updateCartItemQuantity(cartItemId, quantity),
    onMutate: async ({ cartItemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      
      const previousCart = queryClient.getQueryData<CartItem[]>(cartQueryKey);
      
      // Optimistic update
      queryClient.setQueryData<CartItem[]>(cartQueryKey, (old) => {
        if (!Array.isArray(old)) return [];
        
        if (quantity <= 0) {
             return old.filter(item => item.id !== cartItemId);
        }

        return old.map((item) => {
          if (item.id === cartItemId) {
            return {
                ...item,
                quantity,
                // price remains same
            };
          }
          return item;
        });
      });
      
      return { previousCart };
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
    onError: (error, variables, context) => {
       if (context?.previousCart) {
          queryClient.setQueryData<CartItem[]>(cartQueryKey, context.previousCart);
       }
    },
  });
};

// Hook to remove an item from the cart
// Keeping this old hook for now, will remove after full transition
export const useRemoveFromCartMutation = () => {
  const queryClient = useQueryClient();
  // Mutation takes the cart item ID to remove
  return useMutation<RemoveFromCartSuccess | RemoveFromCartFailure, Error, string, { previousCart: CartItem[] | undefined }>({
    mutationFn: (cartItemId) => removeFromCart(cartItemId),
    onMutate: async (cartItemId) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData<CartItem[]>(cartQueryKey);

      // Optimistically update to remove the item
      queryClient.setQueryData<CartItem[]>(cartQueryKey, (old) =>
        (Array.isArray(old) ? old : []).filter(item => item.id !== cartItemId)
      );

      return { previousCart };
    },
    onSuccess: () => {
      // Invalidate the cart query to refetch
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData<CartItem[]>(cartQueryKey, context.previousCart);
      }
    },
  });
};

// Hook to clear the cart
export const useClearCartMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ClearCartSuccess | ClearCartFailure,
    Error,
    void,
    { previousCart: CartItem[] | undefined }
  >({
    mutationFn: () => clearCart(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousCart = queryClient.getQueryData<CartItem[]>(cartQueryKey);
      queryClient.setQueryData<CartItem[]>(cartQueryKey, []);
      return { previousCart };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData<CartItem[]>(cartQueryKey, context.previousCart);
      }
    },
  });
};

// Hook to prefetch cart data
export const usePrefetchCart = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: cartQueryKey,
      queryFn: async () => {
        const result = await getCart();
        if (!result.success) {
          return [];
        }
        return result.data;
      },
    });
  };
};

// Hook to subscribe to cart changes
export const useCartSubscription = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('cart-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
        },
        () => {
          // Invalidate cart query when changes occur
          queryClient.invalidateQueries({ queryKey: cartQueryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);
}; 