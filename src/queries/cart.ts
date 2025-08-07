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
    // Disable optimistic updates for now to fix multiplication bug
    // onMutate: async (newItems) => {
    //   await queryClient.cancelQueries({ queryKey: cartQueryKey });
    //   const previousCart = queryClient.getQueryData<CartItem[]>(cartQueryKey);
    //   return { previousCart };
    // },
    onSuccess: (data) => {
      // Invalidate the cart query to refetch and get the correct state from the server
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
    onError: (error, variables, context) => {
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