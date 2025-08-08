"use client";

import { useCallback } from 'react';
import { useAnonymousCart } from './useAnonymousCart';
import { useUpdateCartMutation, ItemToUpdateMutation } from 'src/queries/cart';
import { anonymousCart, AnonymousCartItem } from 'src/lib/anonymous-cart';

export function useCartMerge() {
  const updateCartMutation = useUpdateCartMutation();

  const mergeAnonymousCartToUser = useCallback(async (authenticatedCartItems: any[] = []) => {
    try {
      // Get anonymous cart items
      const anonymousItems = anonymousCart.getItems();
      
      if (anonymousItems.length === 0) {
        console.log('No anonymous cart items to merge');
        return;
      }

      console.log('Merging anonymous cart items:', anonymousItems);
      
      // Convert authenticated cart items to mutation format
      const authenticatedItemsForMutation: ItemToUpdateMutation[] = authenticatedCartItems.map(item => ({
        product_id: item.product_id || null,
        bundle_id: item.bundle_id || null,
        option: item.option,
        quantity: item.quantity,
        price: item.price || 0
      }));

      // Process anonymous items and merge with authenticated items
      const mergedItems = [...authenticatedItemsForMutation];
      
      anonymousItems.forEach((anonymousItem: AnonymousCartItem) => {
        const existingItemIndex = mergedItems.findIndex(authItem => 
          authItem.product_id === anonymousItem.product_id &&
          authItem.bundle_id === anonymousItem.bundle_id &&
          JSON.stringify(authItem.option || null) === JSON.stringify(anonymousItem.option || null)
        );
        
        if (existingItemIndex > -1) {
          // Item exists in authenticated cart, add quantities
          mergedItems[existingItemIndex].quantity += anonymousItem.quantity;
        } else {
          // New item from anonymous cart, add it
          mergedItems.push({
            product_id: anonymousItem.product_id || null,
            bundle_id: anonymousItem.bundle_id || null,
            option: anonymousItem.option,
            quantity: anonymousItem.quantity,
            price: anonymousItem.price
          });
        }
      });

      // Update the authenticated user's cart with merged items
      await updateCartMutation.mutateAsync(mergedItems);
      
      // Clear the anonymous cart after successful merge
      anonymousCart.clear();
      
      console.log('Anonymous cart successfully merged and cleared');
      
      return mergedItems;
    } catch (error) {
      console.error('Error merging anonymous cart:', error);
      throw error;
    }
  }, [updateCartMutation]);

  return {
    mergeAnonymousCartToUser,
    isMerging: updateCartMutation.isPending
  };
}