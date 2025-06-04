"use client";

import Container from "@components/shared/Container";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2Icon } from "lucide-react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { formatNaira } from "src/lib/utils";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import Link from "next/link";
import { Badge } from "@components/ui/badge";
import { useToast } from "src/hooks/useToast";
import { useMemo, useCallback } from "react";
import {
  useCartQuery,
  useUpdateCartMutation,
  useRemoveFromCartMutation,
  ItemToUpdateMutation,
} from "src/queries/cart";
import { CartItem } from "src/lib/actions/cart.actions";

// Define a more specific type for grouped items
interface GroupedCartItem {
  product: CartItem["products"];
  options: Record<string, CartItem>;
}

const CartPage = () => {
  const router = useRouter();
  const { showToast } = useToast();

  const { data: cartItems, isLoading, isError, error } = useCartQuery();

  // Ensure items is always an array, even if cartItems is null or undefined initially
  const items: CartItem[] = useMemo(() => cartItems || [], [cartItems]); // Explicitly type items as CartItem[]

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

  const handleRemoveItem = useCallback(
    async (itemToRemove: CartItem) => {
      try {
        if (itemToRemove.id) {
          await removeCartItemMutation.mutateAsync(itemToRemove.id);
          showToast("Item removed!", "info");
        }
      } catch (error: any) {
        console.error("Failed to remove item:", error);
        showToast("Failed to remove item from cart.", "error");
      }
    },
    [removeCartItemMutation.mutateAsync, showToast]
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
            "CartPage: handleQuantityChange - Item not found in current cart data.",
            itemToUpdate
          );
          return;
        }

        if (newQuantity === 0) {
          if (existingItemInCart.id) {
            try {
              await removeCartItemMutation.mutateAsync(existingItemInCart.id);
              showToast("Item removed!", "info");
            } catch (error: any) {
              console.error("Failed to remove item via quantity 0:", error);
              showToast("Failed to remove item.", "error");
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
            showToast(
              `${increment ? "Increased" : "Decreased"} quantity for ${
                itemToUpdate.products?.name
              }`,
              "success"
            );
          } catch (error: any) {
            console.error("Failed to update cart item quantity:", error);
            showToast("Failed to update cart.", "error");
          }
        }
      }
    },
    [
      items,
      updateCartMutation.mutateAsync,
      removeCartItemMutation.mutateAsync,
      showToast,
    ]
  );

  const totalQuantity = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((acc, item) => {
        const itemPrice =
          item.option?.price !== undefined && item.option.price !== null
            ? item.option.price
            : item.price || 0;

        let priceToUse = itemPrice;

        // Check if the item belongs to a bundle and get the bundle discount
        if (
          item.bundle_id &&
          item.bundles &&
          item.bundles.discount_percentage !== null &&
          item.bundles.discount_percentage !== undefined
        ) {
          const discountPercentage = item.bundles.discount_percentage;
          // Apply the discount
          priceToUse = itemPrice * (1 - discountPercentage / 100);
        }

        return acc + priceToUse * item.quantity;
      }, 0),
    [items]
  );

  return (
    <main className="">
      <div className="bg-white py-4">
        <Container className="">
          <CustomBreadcrumb />
        </Container>
      </div>
      <Container className="">
        <h1 className="text-2xl font-bold mb-10">
          Your Bag <span className="text-gray-400"> ({totalQuantity})</span>
        </h1>

        {/* Wrap conditional content in a fragment */}
        <>
          {isLoading ? (
            <div className="p-8 text-center">
              <p>Loading cart...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <p>Error loading cart: {error?.error || "Unknown error"}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-semibold">
                  YouPr Bag is empty
                </h2>
                <p className="text-muted-foreground">
                  Start adding some products!
                </p>
                <Button
                  onClick={() => router.push("/")}
                  className="rounded-full px-8 py-4 bg-[#1B6013]"
                  size="lg"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6">
                {Object.entries(groupedItems).map(
                  ([productId, productGroup]: [string, GroupedCartItem]) => (
                    <div
                      key={productId}
                      className="border-b pb-6 last:border-0"
                    >
                      {productGroup.product ? (
                        <h2 className="h4-bold mb-4">
                          {productGroup.product.name}
                        </h2>
                      ) : (
                        <div className="h-8 w-48 bg-gray-200 animate-pulse mb-4 rounded" />
                      )}

                      {Object.entries(productGroup.options).map(
                        ([optionKey, item]: [string, CartItem]) => (
                          <div
                            key={item.id}
                            className="flex gap-4 items-center"
                          >
                            <Link
                              href={`/product/${item.products?.slug}`}
                              className="relative size-16 flex-shrink-0"
                            >
                              <Image
                                src={
                                  item.option?.image ||
                                  item.products?.images?.[0] ||
                                  "/placeholder.png"
                                }
                                alt={item.products?.name || "Product image"}
                                width={64}
                                height={64}
                                className="object-cover rounded-md"
                              />
                            </Link>
                            <div className="flex-1">
                              <p className="font-semibold">
                                {item.products?.name}
                                {/* Display bundle info if item belongs to a bundle */}
                                {item.bundle_id && item.bundles ? (
                                  <Badge variant="secondary" className="ml-2">
                                    Part of &quot;{item.bundles.name}&quot; (
                                    {item.bundles.discount_percentage}% off)
                                  </Badge>
                                ) : null}
                              </p>
                              {/* Display selected option details if any */}
                              {item.option?.name && (
                                <p className="text-sm text-gray-600">
                                  {item.option.name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Display price, applying bundle discount if applicable */}
                              <p className="font-semibold">
                                {(() => {
                                  const itemPrice =
                                    item.option?.price !== undefined &&
                                    item.option.price !== null
                                      ? item.option.price
                                      : item.price || 0;

                                  let priceToDisplay = itemPrice;

                                  if (
                                    item.bundle_id &&
                                    item.bundles &&
                                    item.bundles.discount_percentage !== null &&
                                    item.bundles.discount_percentage !==
                                      undefined
                                  ) {
                                    const discountPercentage =
                                      item.bundles.discount_percentage;
                                    priceToDisplay =
                                      itemPrice *
                                      (1 - discountPercentage / 100);
                                  }

                                  return formatNaira(
                                    priceToDisplay * item.quantity
                                  );
                                })()}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full p-1 size-7"
                                onClick={() => handleRemoveItem(item)}
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )
                )}
              </div>

              {/* Order Summary */}
              <div className="w-full lg:w-96">
                <Card className="p-6 sticky top-6">
                  <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">
                        {formatNaira(subtotal)}
                      </span>
                    </div>
                    {/* Delivery Fee and Total can be calculated based on subtotal and potentially other factors */}
                    {/* For now, let's just show subtotal as total */}
                    <div className="border-t pt-4 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatNaira(subtotal)}</span>
                    </div>
                  </div>
                  <Button
                    className="!bg-[#1B6013] !text-white hover:bg-[#1B6013]/90 hover:!text-white transition-all ease-in-out !rounded w-full mt-4 py-4"
                    onClick={() => {
                      showToast("Proceeding to checkout", "info");
                      router.push("/checkout");
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    or{" "}
                    <button
                      onClick={() => router.push("/")}
                      className="text-primary hover:underline"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      </Container>
    </main>
  );
};

export default CartPage;
