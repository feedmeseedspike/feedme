"use client";
import { useEffect, useRef } from "react";
import { useUser } from "src/hooks/useUser";
import { useCartQuery } from "src/queries/cart";
import { useCartMerge } from "src/hooks/useCartMerge";
import { anonymousCart } from "src/lib/anonymous-cart";

export default function CartMergeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useUser();
  const { data: authenticatedCartItems, isLoading: isCartLoading } = useCartQuery();
  const { mergeAnonymousCartToUser } = useCartMerge();
  const hasMergedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handleCartMerge = async () => {
      // If no user, reset the merge flag and return
      if (!user?.user_id) {
        hasMergedRef.current = false;
        lastUserIdRef.current = null;
        return;
      }

      // Detect user change (login) or initial load with profile
      const userChanged = lastUserIdRef.current !== user.user_id;
      
      // If user changed, we MUST reset the merge flag
      if (userChanged) {
        hasMergedRef.current = false;
        lastUserIdRef.current = user.user_id;
      }

      // Only merge if:
      // 1. We haven't merged for this specific user yet
      // 2. The account cart has finished loading (we need the latest data to merge properly)
      if (!hasMergedRef.current && !isCartLoading && authenticatedCartItems !== undefined) {
        const anonymousItems = anonymousCart.getItems();
        
        if (anonymousItems.length > 0) {
          // Starting cart merge for user
          hasMergedRef.current = true; // Mark as merged immediately to prevent double triggers
          
          try {
            await mergeAnonymousCartToUser(authenticatedCartItems || []);
            // Cart merge completed successfully
            
            // Dispatch event to notify any components listening for anonymous cart changes
            window.dispatchEvent(new Event('anonymousCartUpdated'));
          } catch (error) {
            console.error("[CartMergeProvider] Cart merge failed:", error);
            // On error, we might want to allow a retry on next trigger
            hasMergedRef.current = false;
          }
        } else {
          // No items to merge, but we can mark it as "checked"
          hasMergedRef.current = true;
        }
      }
    };

    handleCartMerge();
  }, [user?.user_id, authenticatedCartItems, isCartLoading, mergeAnonymousCartToUser]);

  return <>{children}</>;
}
