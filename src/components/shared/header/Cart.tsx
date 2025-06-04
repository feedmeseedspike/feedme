"use client";

import React, { useEffect, useCallback } from "react";
import ShoppingCart from "@components/icons/cart.svg";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/ui/sheet";
import { ArrowLeft, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { useUser } from "src/hooks/useUser";
import {
  useCartQuery,
  useUpdateCartMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  cartQueryKey,
  ItemToUpdateMutation,
  usePrefetchCart,
  useCartSubscription,
} from "src/queries/cart";
import { CartItem } from "src/lib/actions/cart.actions";
import { formatNaira } from "src/lib/utils";
import { Input } from "@components/ui/input";
import Link from "next/link";

// Define a more specific type for grouped items
interface GroupedCartItem {
  product: CartItem["products"];
  options: Record<string, CartItem>;
}

const Cart = React.memo(({ asLink = false }: { asLink?: boolean }) => {
  const router = useRouter();
  const { data: cartItems, isLoading, isError, error } = useCartQuery();
  // console.log("cartItems here", cartItems);
  const user = useUser();
  // console.log("userId here", userId);
  const prefetchCart = usePrefetchCart();
  useCartSubscription(); // Subscribe to cart changes

  // Ensure items is always an array, even if cartItems is null or undefined initially
  const items: CartItem[] = useMemo(() => cartItems || [], [cartItems]); // Explicitly type items as CartItem[]
  // console.log("items here", items);

  // Group cart items by product and option for display
  const groupedItems = useMemo(() => {
    return items.reduce(
      (acc: Record<string, GroupedCartItem>, item: CartItem) => {
        const productId = item.product_id;
        if (!productId) return acc; // Skip items without a product_id

        if (!acc[productId]) {
          acc[productId] = {
            product: item.products, // Store product details here
            options: {}, // Nested object to group by option
          };
        }

        // Use a unique key for the option, e.g., JSON stringify the option object or use a combination of product ID and option details
        const optionKey = item.option
          ? JSON.stringify(item.option)
          : "no-option";

        // Add the current cart item to the options grouping
        acc[productId].options[optionKey] = item;

        return acc;
      },
      {}
    ); // Initialize with an empty object, type asserted by the accumulator
  }, [items]);

  const updateCartMutation = useUpdateCartMutation();
  const removeCartItemMutation = useRemoveFromCartMutation();
  const clearCartMutation = useClearCartMutation();

  const handleCheckout = () => {
    router.push("/checkout");
  };

  const handleRemoveItem = useCallback(
    async (itemToRemove: CartItem) => {
      try {
        if (itemToRemove.id) {
          await removeCartItemMutation.mutateAsync(itemToRemove.id);
          // showToast('Item removed!', 'info');
        }
        // Remove Supabase sync logic
      } catch (error: any) {
        console.error("Failed to remove item:", error);
        // Handle error (e.g., show a toast)
      }
    },
    [removeCartItemMutation.mutateAsync]
  );

  const handleQuantityChange = useCallback(
    async (itemToUpdate: CartItem, increment: boolean) => {
      const newQuantity = increment
        ? itemToUpdate.quantity + 1
        : itemToUpdate.quantity - 1;

      if (newQuantity >= 0) {
        const existingItemInCart = items.find(
          (cartItem) => cartItem.id === itemToUpdate.id
        );

        if (!existingItemInCart) {
          console.error(
            "AddToCart: handleQuantityChange - Item not found in current cart data.",
            itemToUpdate
          );
          return;
        }

        if (newQuantity === 0) {
          if (existingItemInCart.id) {
            try {
              await removeCartItemMutation.mutateAsync(existingItemInCart.id);
            } catch (error: any) {
              console.error("Failed to remove item via quantity 0:", error);
            }
          }
        } else {
          const itemsForMutation: ItemToUpdateMutation[] = items
            .map((cartItem) => {
              const priceToUse =
                cartItem.option?.price !== undefined &&
                cartItem.option.price !== null
                  ? cartItem.option.price
                  : cartItem.price || 0;

              return {
                product_id: cartItem.product_id || "",
                option: cartItem.option,
                quantity:
                  cartItem.id === itemToUpdate.id
                    ? newQuantity
                    : cartItem.quantity,
                price: priceToUse,
              };
            })
            .filter((item) => item.quantity > 0);

          try {
            await updateCartMutation.mutateAsync(itemsForMutation);
          } catch (error: any) {
            console.error("Failed to update cart item quantity:", error);
          }
        }
      }
    },
    [items, updateCartMutation.mutateAsync, removeCartItemMutation.mutateAsync]
  );

  const handleClearCart = useCallback(async () => {
    try {
      await clearCartMutation.mutateAsync();
    } catch (error: any) {
      console.error("Failed to clear cart:", error);
    }
  }, [clearCartMutation.mutateAsync]);

  const totalQuantity = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (acc, item) =>
          acc +
          ((item.option?.price !== undefined && item.option.price !== null
            ? item.option.price
            : item.price) || 0) *
            item.quantity,
        0
      ), // Add initial value 0
    [items]
  );

  if (asLink) {
    return (
      <div className="relative" onMouseEnter={prefetchCart}>
        <ShoppingCart className="size-[24px]" />
        {items.length > 0 && (
          <p className="absolute -top-2 -right-2 bg-[#D0D5DD] px-[7px] py-[2px] rounded-full text-xs text-white">
            {totalQuantity}
          </p>
        )}
      </div>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="relative cursor-pointer" onMouseEnter={prefetchCart}>
          <ShoppingCart className="size-[24px]" />
          {items.length > 0 && (
            <p className="absolute -top-2 -right-[6px] sm:-right-2 bg-[#D0D5DD] px-[5px] py-[2.2px] sm:px-[6px] sm:py-[2.2px] rounded-full text-[10px] sm:text-xs text-white font-semibold">
              {totalQuantity}
            </p>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-4 md:!max-w-xl">
        <SheetHeader className="flex justify-between w-full items-center">
          <SheetClose className="rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <ArrowLeft className="size-[22px]" />
          </SheetClose>
          <SheetTitle className="h2-bold flex-1 text-center">
            Cart ({totalQuantity})
          </SheetTitle>
          {items.length > 0 && (
            <p
              className="badge cursor-pointer w-fit select-none"
              onClick={handleClearCart}
            >
              Clear Cart
            </p>
          )}
        </SheetHeader>

        <div className="flex grow flex-col space-y-5 overflow-y-auto pt-1">
          {isLoading && <p>Loading cart...</p>}
          {isError && <p>Error loading cart: {error?.error}</p>}

          {!isLoading && !isError && items.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p className="text-lg font-semibold">Your cart is empty.</p>
              <p className="text-sm text-gray-400">
                Start adding items to your cart!
              </p>
            </div>
          ) : (
            // Iterate over groupedItems instead of items
            Object.entries(groupedItems).map(
              ([productId, productGroup]: [string, GroupedCartItem]) => (
                <div key={productId} className="flex flex-col gap-4">
                  {/* Display product level info here if needed, e.g., product image/name once */}
                  <div className="flex items-center gap-2">
                    {productGroup.product ? (
                      <p className="h6-bold text-lg">
                        {productGroup.product.name}
                      </p>
                    ) : (
                      <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
                    )}
                  </div>
                  {Object.entries(productGroup.options).map(
                    ([optionKey, item]: [string, CartItem]) => (
                      <React.Fragment key={item.id}>
                        {" "}
                        {/* Use item.id for key */}
                        <div className="flex items-center gap-3 sm:gap-4 overflow-y-visible">
                          <Link href={`/product/${item.products?.slug}`}>
                            <Image
                              width={64}
                              height={64}
                              src={
                                item.option?.image ||
                                item.products?.images?.[0] ||
                                "/placeholder.png"
                              }
                              alt={item.products?.name || "Product image"}
                              className="h-[64px] rounded-[5px] border-[0.31px] border-[#DDD5DD] object-contain"
                            />
                          </Link>
                          <div className="flex flex-col gap-[6px] w-full">
                            <div className="flex justify-between">
                              {/* Product name is displayed above, here we can show option name */}
                              {item.option?.name && (
                                <p className="h6-light !text-[14px]">
                                  {item.option.name}
                                </p>
                              )}
                              <Trash2Icon
                                className="size-4 cursor-pointer"
                                onClick={() =>
                                  handleRemoveItem(item as CartItem)
                                }
                                aria-label="Remove item"
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-[#101828] font-bold">
                                {formatNaira(
                                  (item.option?.price !== undefined &&
                                  item.option.price !== null
                                    ? item.option.price
                                    : item.price) || 0
                                )}{" "}
                                {/* Use option price if available */}
                              </p>
                              <div className="flex items-center gap-2 sm:gap-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-[9px] bg-[#D0D5DD] rounded-[4px] p-3 text-white"
                                  onClick={() =>
                                    handleQuantityChange(
                                      item as CartItem,
                                      false
                                    )
                                  }
                                >
                                  <AiOutlineMinus />
                                </Button>
                                <span>{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-[9px] bg-[#1B6013] rounded-[4px] p-3 text-white"
                                  onClick={() =>
                                    handleQuantityChange(item as CartItem, true)
                                  }
                                >
                                  <AiOutlinePlus />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Separator />
                      </React.Fragment>
                    )
                  )}
                </div>
              )
            )
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="mt-auto">
            <div className="w-full">
              <Separator className="my-2" />
              <div className="h4-light flex justify-between">
                <p>Subtotal</p>
                <p>{formatNaira(subtotal)}</p>
              </div>
              <div className="flex w-full items-center pt-[10px] gap-3">
                <Input
                  type="text"
                  placeholder="Discount Code"
                  className="h-10 placeholder:text-xs text-[#737373] placeholder:font-semibold"
                />
                <Button
                  type="button"
                  className="btn-primary !text-[#B7CDB4] !bg-[#F2F4F7] h-10"
                >
                  Apply
                </Button>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-[14px] text-[#101828]">
                <p>Total</p>
                <p>{formatNaira(subtotal)}</p>
              </div>
              <p className="text-black">Delivery fees not included yet.</p>
              <button
                className="mt-3 w-full btn-primary"
                onClick={handleCheckout}
              >
                Checkout
              </button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
});

Cart.displayName = "Cart";

export default Cart;
