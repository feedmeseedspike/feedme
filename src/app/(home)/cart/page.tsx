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
import { useMemo, useCallback, useState, useTransition } from "react";
import {
  useCartQuery,
  useUpdateCartMutation,
  useRemoveFromCartMutation,
  ItemToUpdateMutation,
} from "src/queries/cart";
import { CartItem, ProductOption } from "src/lib/actions/cart.actions";
import { useUser } from "src/hooks/useUser";
import {
  getUsersPurchasedProductIds,
  getAllProducts,
} from "src/queries/products";
import { createClient } from "@utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tables } from "src/utils/database.types";
import ProductSlider from "@components/shared/product/product-slider";
import { mapSupabaseProductToIProductInput, CategoryData } from "src/lib/utils";
import { getAllCategoriesQuery } from "src/queries/categories";
import { IProductInput } from "src/types";
import { Input } from "@components/ui/input";
import { Separator } from "@components/ui/separator";

interface GroupedCartItem {
  product?: CartItem["products"];
  bundle?: CartItem["bundles"];
  options: Record<string, CartItem>;
}

const CartPage = () => {
  const router = useRouter();
  const { showToast } = useToast();

  const { data: cartItems, isLoading, isError, error } = useCartQuery();

  // Ensure items is always an array, even if cartItems is null or undefined initially
  const items: CartItem[] = useMemo(() => cartItems || [], [cartItems]);

  // Group cart items by product and option for display
  const groupedItems = useMemo(() => {
    return items.reduce(
      (acc: Record<string, GroupedCartItem>, item: CartItem) => {
        let key: string;
        if (item.product_id) {
          key = `product-${item.product_id}`;
          if (!acc[key]) {
            acc[key] = {
              product: item.products,
              options: {},
            };
          }
          const optionKey = item.option
            ? JSON.stringify(item.option)
            : "no-option";
          acc[key].options[optionKey] = item;
        } else if (item.bundle_id) {
          key = `bundle-${item.bundle_id}`;
          if (!acc[key]) {
            acc[key] = {
              bundle: item.bundles,
              options: {},
            };
          }
          // For bundles, there's typically no 'option' in the same sense as products,
          // so we can use a fixed key or check if there's any bundle-specific option if applicable.
          acc[key].options["bundle-item"] = item;
        }
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
              let priceToUse: number = 0;
              if (cartItem.bundle_id && cartItem.bundles) {
                priceToUse = cartItem.bundles.price || 0;
              } else if (cartItem.product_id && cartItem.products) {
                // Safely access properties on item.option after checking if it's an object
                const productOption =
                  cartItem.option as unknown as ProductOption | null;
                priceToUse =
                  (productOption?.price !== undefined &&
                  productOption?.price !== null
                    ? productOption.price
                    : cartItem.price) || 0;
              }

              return {
                product_id: cartItem.product_id,
                bundle_id: cartItem.bundle_id,
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
                itemToUpdate.products?.name ||
                itemToUpdate.bundles?.name ||
                "item"
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
        let itemPrice = 0;
        if (item.bundle_id && item.bundles) {
          itemPrice = item.bundles.price || 0;
        } else if (item.product_id && item.products) {
          const productOption = item.option as unknown as ProductOption | null;
          itemPrice =
            (productOption?.price !== undefined && productOption?.price !== null
              ? productOption.price
              : item.price) || 0;
        }
        return acc + itemPrice * item.quantity;
      }, 0),
    [items]
  );

  const totalAmount = useMemo(() => subtotal, [subtotal]); // Calculate total with discount

  const user = useUser();
  const supabase = createClient();

  const { data: purchasedProductIds, isLoading: isLoadingPurchased } = useQuery<
    string[]
  >({
    // Corrected type to string[]
    queryKey: ["purchasedProductIds", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return getUsersPurchasedProductIds(supabase, user.id);
    },
    enabled: !!user?.id,
  });

  const { data: allCategories, isLoading: isLoadingCategories } = useQuery<
    CategoryData[]
  >({
    queryKey: ["allCategories"],
    queryFn: async () => {
      const { data, error } = await getAllCategoriesQuery(supabase).select(
        "id, title, thumbnail"
      );
      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
      // Explicitly cast thumbnail to string | null as expected by CategoryData
      const categories: CategoryData[] = data.map((cat) => ({
        id: cat.id,
        title: cat.title,
        thumbnail: cat.thumbnail as string | null, // Ensure thumbnail is string | null
      }));
      return categories;
    },
  });

  const { data: recommendedProducts, isLoading: isLoadingRecommended } =
    useQuery<IProductInput[]>({
      // Corrected type to IProductInput[]
      queryKey: ["recommendedProducts"],
      queryFn: async () => {
        // Fetch all products
        const allProductsResult = await getAllProducts(supabase, {});

        if (!allProductsResult || !allProductsResult.products) {
          console.error("Error fetching all products:", allProductsResult);
          return [];
        }

        const productsToRecommend = allProductsResult.products.filter(
          (
            product: Tables<"products"> // Explicitly type product
          ) => !purchasedProductIds || !purchasedProductIds.includes(product.id)
        );
       

        const categoryMap = new Map(
          allCategories?.map((cat: CategoryData) => [cat.id, cat]) || [] 
        );

        const mappedProducts: IProductInput[] = productsToRecommend
          .map((product: Tables<"products">) =>
            mapSupabaseProductToIProductInput(product, allCategories || [])
          )
          .filter((p: IProductInput) => {
            const filterCondition = p.stockStatus === "in_stock";
            return filterCondition;
          });

        return mappedProducts.slice(0, 10);
      },
      enabled: !isLoadingCategories && !isLoadingPurchased,
    });

  const handleCheckout = () => {
    router.push("/checkout");
  };

  const {
    data: recentlyViewedProductSlugs,
    isLoading: isLoadingRecentlyViewedSlugs,
  } = useQuery<string[]>({
    queryKey: ["recentlyViewedProductSlugs"],
    queryFn: async () => {
      if (typeof window !== "undefined") {
        const slugs = JSON.parse(
          localStorage.getItem("recentlyViewedProducts") || "[]"
        ) as string[];
        return slugs;
      }
      return [];
    },
  });

  const { data: recentlyViewedProducts, isLoading: isLoadingRecentlyViewed } =
    useQuery<IProductInput[]>({
      queryKey: ["recentlyViewedProducts", recentlyViewedProductSlugs],
      queryFn: async () => {
        if (
          !recentlyViewedProductSlugs ||
          recentlyViewedProductSlugs.length === 0
        )
          return [];

        const allProductsResult = await getAllProducts(supabase, {});
        if (!allProductsResult || !allProductsResult.products) {
          console.error(
            "Error fetching all products for recently viewed:",
            allProductsResult
          );
          return [];
        }

        const mappedRecentlyViewedProducts: IProductInput[] =
          allProductsResult.products
            .filter((product: Tables<"products">) =>
              recentlyViewedProductSlugs.includes(product.slug || "")
            )
            .map((product: Tables<"products">) =>
              mapSupabaseProductToIProductInput(product, allCategories || [])
            )
            .filter((p: IProductInput) => p.stockStatus === "in_stock");

        // Filter out products that are already in the cart or recommended
        const filteredRecentlyViewedProducts =
          mappedRecentlyViewedProducts.filter(
            (rvProduct) =>
              !items.some((cartItem) => cartItem.product_id === rvProduct.id) &&
              !recommendedProducts?.some(
                (recProduct) => recProduct.id === rvProduct.id
              )
          );

        return filteredRecentlyViewedProducts.slice(0, 10);
      },
      enabled:
        !!recentlyViewedProductSlugs &&
        !isLoadingCategories &&
        !isLoadingRecommended,
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <CustomBreadcrumb />

        <h1 className="text-3xl font-bold mb-6 text-center">Your Cart</h1>

        {isLoading && (
          <p className="text-center text-gray-500">Loading cart...</p>
        )}
        {isError && (
          <p className="text-center text-red-500">
            Error loading cart: {error?.error}
          </p>
        )}

        {!isLoading && !isError && items.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p className="text-lg font-semibold">Your cart is empty.</p>
            <p className="text-sm text-gray-400">
              Start adding delicious items to your cart!
            </p>
            <Link href="/">
              <Button className="mt-4 btn-primary">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Cart Items */}
            <div className="md:col-span-2 space-y-6">
              {Object.entries(groupedItems).map(
                ([groupKey, productGroup]: [string, GroupedCartItem]) => (
                  <Card key={groupKey} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      {productGroup.product?.name ? (
                        <h2 className="h6-bold text-xl">
                          {productGroup.product.name}
                        </h2>
                      ) : productGroup.bundle?.name ? (
                        <h2 className="h6-bold text-xl">
                          {productGroup.bundle.name}
                        </h2>
                      ) : (
                        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
                      )}
                      <Trash2Icon
                        className="size-5 cursor-pointer text-gray-500 hover:text-red-500 transition-colors"
                        onClick={() => {
                          // Find the first item in the group to remove
                          const itemToRemove = Object.values(
                            productGroup.options
                          )[0];
                          if (itemToRemove) {
                            handleRemoveItem(itemToRemove);
                          }
                        }}
                        aria-label="Remove all items in this group"
                      />
                    </div>
                    <div className="space-y-4">
                      {Object.entries(productGroup.options).map(
                        ([optionKey, item]: [string, CartItem]) => (
                          <div key={item.id}>
                            <div className="flex items-center gap-3 sm:gap-4">
                              <Link
                                href={`/product/${
                                  item.products?.slug || item.bundles?.id
                                }`}
                              >
                                <Image
                                  width={80}
                                  height={80}
                                  src={
                                    (item.option as ProductOption)?.image ||
                                    item.products?.images?.[0] ||
                                    item.bundles?.thumbnail_url ||
                                    "/placeholder.png"
                                  }
                                  alt={
                                    item.products?.name ||
                                    item.bundles?.name ||
                                    "Item image"
                                  }
                                  className="h-20 w-20 rounded-md object-cover border border-gray-200"
                                />
                              </Link>
                              <div className="flex flex-col flex-1">
                                <div className="flex justify-between items-start">
                                  <p className="font-semibold text-base">
                                    {item.option
                                      ? (item.option as ProductOption).name
                                      : item.products?.name}
                                  </p>
                                  <Trash2Icon
                                    className="size-4 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                                    onClick={() => handleRemoveItem(item)}
                                    aria-label="Remove individual item"
                                  />
                                </div>
                                <p className="text-gray-600 text-sm">
                                  {formatNaira(
                                    (item.option as ProductOption)?.price !==
                                      undefined &&
                                      (item.option as ProductOption)?.price !==
                                        null
                                      ? (item.option as ProductOption)?.price
                                      : item.price || 0
                                  )}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="size-8 rounded-full border-gray-300"
                                      onClick={() =>
                                        handleQuantityChange(item, false)
                                      }
                                    >
                                      <AiOutlineMinus className="size-4" />
                                    </Button>
                                    <span className="font-medium">
                                      {item.quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="size-8 rounded-full border-gray-300"
                                      onClick={() =>
                                        handleQuantityChange(item, true)
                                      }
                                    >
                                      <AiOutlinePlus className="size-4" />
                                    </Button>
                                  </div>
                                  <p className="font-bold text-lg">
                                    {formatNaira(
                                      ((item.option as ProductOption)?.price ??
                                        (item.price as number) ??
                                        0) * item.quantity
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {optionKey !==
                              Object.keys(productGroup.options).at(-1) && (
                              <Separator className="my-4" />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </Card>
                )
              )}
            </div>

            {/* Right Column: Order Summary */}
            <div className="md:col-span-1">
              <Card className="p-6 space-y-4 sticky top-4">
                <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
                <div className="flex justify-between text-lg">
                  <p>Subtotal ({totalQuantity} items)</p>
                  <p className="font-semibold">{formatNaira(subtotal)}</p>
                </div>

                <Separator />

                <div className="flex justify-between text-xl font-bold">
                  <p>Total</p>
                  <p>{formatNaira(subtotal)}</p>
                </div>
                <p className="text-gray-500 text-sm">
                  Delivery fees not included yet.
                </p>

                <Button
                  className="w-full btn-primary mt-6"
                  onClick={handleCheckout}
                  disabled={items.length === 0}
                >
                  Proceed to Checkout
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* Recommended Products Section */}
        {(isLoadingRecommended ||
          (recommendedProducts && recommendedProducts.length > 0)) && (
          <section className="mt-12">
            <ProductSlider
              title="Recommended for You"
              products={recommendedProducts}
              hideDetails={false}
            />
          </section>
        )}

        {/* Recently Viewed Products Section */}
        {(isLoadingRecentlyViewed ||
          (recentlyViewedProducts && recentlyViewedProducts.length > 0)) && (
          <section className="mt-12">
            <ProductSlider
              title="Recently Viewed"
              products={recentlyViewedProducts}
              hideDetails={false}
            />
          </section>
        )}
      </Container>
    </div>
  );
};

export default CartPage;
