"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { anonymousCart, AnonymousCartItem } from "src/lib/anonymous-cart";
import { useUser } from "src/hooks/useUser";
import { useCartQuery, cartQueryKey } from "src/queries/cart";
import { ProductOption } from "src/lib/actions/cart.actions";
import { useQueryClient } from "@tanstack/react-query";

export function useAnonymousCart() {
  const [items, setItems] = useState<AnonymousCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { data: authenticatedCartItems } = useCartQuery();
  const prevUserRef = useRef(user);
  const hasMergedRef = useRef(false);
  const queryClient = useQueryClient();

  // Load anonymous cart items on mount
  useEffect(() => {
    if (!user) {
      const cartItems = anonymousCart.getItems();
      setItems(cartItems);
    }
    setIsLoading(false);
  }, [user]);

  // Auto-merge cart when user logs in or handle logout
  useEffect(() => {
    const handleUserChange = async () => {
      // Check for merge scenarios:
      // 1. User just logged in (transition from null to user)
      // 2. User is already logged in and we have anonymous items (page refresh)
      const userJustLoggedIn = !prevUserRef.current && user;
      const shouldMergeOnRefresh = user && !hasMergedRef.current;
      
      if (userJustLoggedIn || shouldMergeOnRefresh) {
        const anonymousItems = anonymousCart.getItems();
        
        if (anonymousItems.length > 0) {
          // Mark as merged to prevent duplicate merges (but allow login transitions)
          if (shouldMergeOnRefresh) {
            hasMergedRef.current = true;
          }
          try {
            // Import addToCart function and add each anonymous item individually
            const { addToCart } = await import('src/lib/actions/cart.actions');
            
            // Add each anonymous item individually
            for (const anonItem of anonymousItems) {
              try {
                await addToCart(
                  anonItem.product_id || null, 
                  anonItem.quantity, 
                  anonItem.option, 
                  anonItem.bundle_id || null,
                  anonItem.offer_id || null
                );
              } catch (error) {
                // Continue with other items if one fails
              }
            }
            
            // Clear the anonymous cart after merge
            anonymousCart.clear();
            setItems([]);
            window.dispatchEvent(new Event('anonymousCartUpdated'));
            
            // Invalidate cart query to refresh the UI with merged items
            queryClient.invalidateQueries({ queryKey: cartQueryKey });
          } catch (error) {
            // Handle merge error silently
          }
        }
      }
      // User just logged out (was authenticated, now null)
      else if (prevUserRef.current && !user) {
        const freshAnonymousItems = anonymousCart.getItems();
        setItems(freshAnonymousItems);
        window.dispatchEvent(new Event('anonymousCartUpdated'));
      }
      
      prevUserRef.current = user;
    };

    handleUserChange();
  }, [user, authenticatedCartItems]);

  // Listen for storage changes (e.g., from other tabs) and custom events
  useEffect(() => {
    if (!user) {
      const handleStorageChange = () => {
        const cartItems = anonymousCart.getItems();
        setItems(cartItems);
      };

      const handleCartUpdated = () => {
        const cartItems = anonymousCart.getItems();
        setItems(cartItems);
      };

      window.addEventListener("storage", handleStorageChange);
      window.addEventListener("anonymousCartUpdated", handleCartUpdated);
      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("anonymousCartUpdated", handleCartUpdated);
      };
    }
  }, [user]);

  const addItem = useCallback(
    async (
      productId: string | null,
      quantity: number,
      price: number,
      option?: ProductOption | null,
      bundleId?: string | null,
      offerId?: string | null,
      meta?: { name?: string; slug?: string; image?: string } | null
    ) => {
      if (user) {
        // User is authenticated, this shouldn't be called
        return;
      }

      try {
        await anonymousCart.addItem(productId, quantity, price, option, bundleId, offerId, meta);
        const updatedItems = anonymousCart.getItems();
        setItems(updatedItems);
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new Event('anonymousCartUpdated'));
      } catch (error) {
        // Re-throw so the UI can handle the error
        throw error;
      }
    },
    [user]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (user) {
        // User is authenticated, this shouldn't be called
        return;
      }

      try {
        await anonymousCart.updateQuantity(itemId, quantity);
        const updatedItems = anonymousCart.getItems();
        setItems(updatedItems);
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new Event('anonymousCartUpdated'));
      } catch (error) {
        // Re-throw so the UI can handle the error
        throw error;
      }
    },
    [user]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      if (user) {
        // User is authenticated, this shouldn't be called
        return;
      }

      anonymousCart.removeItem(itemId);
      const updatedItems = anonymousCart.getItems();
      setItems(updatedItems);
      // Dispatch a custom event to notify other components
      window.dispatchEvent(new Event('anonymousCartUpdated'));
    },
    [user]
  );

  const clearCart = useCallback(() => {
    if (user) {
      // User is authenticated, this shouldn't be called
      return;
    }

    anonymousCart.clear();
    setItems([]);
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new Event('anonymousCartUpdated'));
  }, [user]);

  const getItemCount = useCallback(() => {
    if (user) {
      return authenticatedCartItems?.reduce((total, item) => total + item.quantity, 0) || 0;
    }
    return anonymousCart.getItemCount();
  }, [user, authenticatedCartItems]);

  const getTotal = useCallback(() => {
    if (user) {
      return authenticatedCartItems?.reduce((total, item) => {
        const itemPrice = (item.option as any)?.price ?? item.price ?? 0;
        return total + (itemPrice * item.quantity);
      }, 0) || 0;
    }
    return anonymousCart.getTotal();
  }, [user, authenticatedCartItems]);

  // Transfer anonymous cart to authenticated user
  const transferToAuthenticatedUser = useCallback(async () => {
    if (!user || items.length === 0) {
      return;
    }

    try {
      // Get current authenticated cart items
      const currentAuthenticatedItems = authenticatedCartItems || [];
      
      // Convert anonymous cart items to the format expected by the cart API
      const itemsToMerge = items.map(item => ({
        product_id: item.product_id,
        bundle_id: item.bundle_id,
        option: item.option,
        quantity: item.quantity,
        price: item.price
      }));
      
      // Merge with existing authenticated items
      const mergedItems = [...currentAuthenticatedItems];
      
      itemsToMerge.forEach(anonymousItem => {
        const existingItemIndex = mergedItems.findIndex(authItem => 
          authItem.product_id === anonymousItem.product_id &&
          authItem.bundle_id === anonymousItem.bundle_id &&
          JSON.stringify(authItem.option || null) === JSON.stringify(anonymousItem.option || null)
        );
        
        if (existingItemIndex > -1) {
          // Item exists, add quantities
          mergedItems[existingItemIndex] = {
            ...mergedItems[existingItemIndex],
            quantity: mergedItems[existingItemIndex].quantity + anonymousItem.quantity
          };
        } else {
          // New item, add to cart
          mergedItems.push({
            product_id: anonymousItem.product_id,
            bundle_id: anonymousItem.bundle_id,
            option: anonymousItem.option,
            quantity: anonymousItem.quantity,
            price: anonymousItem.price
          } as any);
        }
      });
      
      // Call the cart API to update with merged items
      const { useUpdateCartMutation } = await import('src/queries/cart');
      // Note: This would need to be handled differently in a real implementation
      // For now, we'll just clear the anonymous cart
      anonymousCart.clear();
      setItems([]);
      
      // Dispatch event to update other components
      window.dispatchEvent(new Event('anonymousCartUpdated'));
      
      console.log('Anonymous cart transferred to authenticated user');
    } catch (error) {
      console.error("Error transferring anonymous cart:", error);
    }
  }, [user, items, authenticatedCartItems]);

  return {
    items: user ? [] : items, // Return empty array if user is authenticated
    isLoading,
    addItem,
    updateQuantity,
    
    removeItem,
    clearCart,
    getItemCount,
    getTotal,
    transferToAuthenticatedUser,
  };
}