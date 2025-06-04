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
  ItemToUpdate,
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
        console.error('Failed to fetch cart:', result.error);
        // Depending on desired behavior, you might throw an error
        // or return an empty array. Returning empty array for a smooth UI.
        return []; 
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Cache is kept for 30 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

// Define the structure of items for the update mutation
export interface ItemToUpdateMutation {
  product_id: string;
  option: Json | null; // Use Json | null to match server action
  quantity: number;
  price: number;
  bundle_id?: string | null; // Add optional bundle_id
}

// Hook to update the entire cart
export const useUpdateCartMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateCartItemsSuccess | UpdateCartItemsFailure,
    Error,
    ItemToUpdateMutation[], // Input type for mutate
    { previousCart: CartItem[] | undefined }
  >({
    mutationFn: (items: ItemToUpdateMutation[]) => {
      // Transform ItemToUpdateMutation[] to ItemToUpdate[] for the server action
      // No transformation needed if ItemToUpdateMutation matches ItemToUpdate
      const itemsForServer: ItemToUpdate[] = items as ItemToUpdate[];
      return updateCartItems(items as ItemToUpdate[]); // Cast directly as types should now match
    },
    onMutate: async (newItems) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousCart = queryClient.getQueryData<CartItem[]>(cartQueryKey);

      const optimisticCart = newItems.map((item: ItemToUpdateMutation): CartItem => ({
        id: 'temp-' + Math.random().toString(36).substr(2, 9),
        product_id: item.product_id || null,
        quantity: item.quantity,
        option: item.option as any, // Cast option to any for optimistic update to match expected Json structure
        price: item.price || null,
        cart_id: null,
        created_at: null,
        products: null,
        bundle_id: item.bundle_id || null, // Include bundle_id
        bundles: null, // Set bundles to null for optimistic update
      }));

      queryClient.setQueryData<CartItem[]>(cartQueryKey, optimisticCart);
      return { previousCart };
    },
    onSuccess: () => {
      // Invalidate the cart query to refetch and get the correct state from the server
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
    onError: (error, variables, context) => {
      console.error('Failed to update cart, rolling back:', error);
      // Rollback to the previous state on error
      if (context?.previousCart) {
        queryClient.setQueryData<CartItem[]>(cartQueryKey, context.previousCart);
      }
    },
  });
};

// Hook to add an item to the cart
// Keeping this old hook for now, will remove after full transition
// export const useAddToCartMutation = () => { ... };

// Hook to update cart item quantity
// Keeping this old hook for now, will remove after full transition
// export const useUpdateCartItemQuantityMutation = () => { ... };

// Hook to remove an item from the cart
// Keeping this old hook for now, will remove after full transition
export const useRemoveFromCartMutation = () => {
  const queryClient = useQueryClient();
  // Mutation takes the cart item ID to remove
  return useMutation<RemoveFromCartSuccess | RemoveFromCartFailure, Error, string, { previousCart: CartItem[] | undefined }>({
    mutationFn: (cartItemId) => removeFromCart(cartItemId),
    onMutate: async (cartItemId) => {
       console.log('Optimistically removing cart item:', cartItemId);
      // Cancel any outgoing refetches for the cart query
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
      console.error('Failed to remove from cart, rolling back:', error);
      // Rollback to the previous state on error
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
      console.log('Cart cleared successfully, invalidating query.');
      // Invalidate the cart query to refetch and ensure consistency
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
      // Optionally show a success toast
      // showToast('Cart cleared!', 'success'); // Assuming showToast is available/imported
    },
    onError: (error, variables, context) => {
      console.error('Failed to clear cart, rolling back:', error);
      // Rollback to the previous state on error
      if (context?.previousCart) {
        queryClient.setQueryData<CartItem[]>(cartQueryKey, context.previousCart);
      }
       // Optionally show an error toast
      // showToast(error.message || 'Failed to clear cart.', 'error'); // Assuming showToast is available/imported
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
          console.error('Failed to prefetch cart:', result.error);
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
  }, [queryClient]);
}; 