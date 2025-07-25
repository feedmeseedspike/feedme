"use client";
import React, { useMemo, useCallback, useState } from "react";
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
import ProductSlider from "@components/shared/product/product-slider";
import { Input } from "@components/ui/input";
import { Separator } from "@components/ui/separator";
import { CartItem, ProductOption } from "src/lib/actions/cart.actions";
import {
  ItemToUpdateMutation,
  useUpdateCartMutation,
  useRemoveFromCartMutation,
} from "src/queries/cart";
import { IProductInput } from "src/types";
import { Tables } from "src/utils/database.types";

interface GroupedCartItem {
  product?: CartItem["products"];
  bundle?: CartItem["bundles"];
  options: Record<string, CartItem>;
}

interface CartClientProps {
  user: any;
  cartItems: CartItem[];
  purchasedProductIds: string[];
  allCategories: any[];
  recommendedProducts: IProductInput[];
}

function isProductOption(option: unknown): option is ProductOption {
  return (
    typeof option === "object" &&
    option !== null &&
    "price" in option &&
    typeof (option as any).price === "number"
  );
}

function isIProductInput(product: any): product is IProductInput {
  return (
    typeof product === "object" &&
    product !== null &&
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.slug === "string" &&
    Array.isArray(product.category) &&
    typeof product.price === "number" &&
    typeof product.list_price === "number"
  );
}

const CartClient: React.FC<CartClientProps> = ({
  user,
  cartItems,
  purchasedProductIds,
  allCategories,
  recommendedProducts,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>(cartItems);

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
          acc[key].options["bundle-item"] = item;
        }
        return acc;
      },
      {}
    );
  }, [items]);

  const updateCartMutation = useUpdateCartMutation();
  const removeCartItemMutation = useRemoveFromCartMutation();

  const handleRemoveItem = useCallback(
    async (itemToRemove: CartItem) => {
      try {
        if (itemToRemove.id) {
          await removeCartItemMutation.mutateAsync(itemToRemove.id);
          setItems((prev) => prev.filter((i) => i.id !== itemToRemove.id));
          showToast("Item removed!", "info");
        }
      } catch (error: any) {
        console.error("Failed to remove item:", error);
        showToast("Failed to remove item from cart.", "error");
      }
    },
    [removeCartItemMutation, showToast]
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
            "CartClient: handleQuantityChange - Item not found in current cart data.",
            itemToUpdate
          );
          return;
        }

        if (newQuantity === 0) {
          if (existingItemInCart.id) {
            try {
              await removeCartItemMutation.mutateAsync(existingItemInCart.id);
              setItems((prev) =>
                prev.filter((i) => i.id !== existingItemInCart.id)
              );
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
                const productOption = isProductOption(cartItem.option)
                  ? cartItem.option
                  : null;
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
            setItems(
              itemsForMutation
                .map((item) => {
                  const found = items.find(
                    (i) =>
                      i.product_id === item.product_id &&
                      i.bundle_id === item.bundle_id &&
                      JSON.stringify(i.option) === JSON.stringify(item.option)
                  );
                  return found ? { ...found, quantity: item.quantity } : found;
                })
                .filter(Boolean) as CartItem[]
            );
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
    [items, updateCartMutation, removeCartItemMutation, showToast]
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
          const productOption = isProductOption(item.option)
            ? item.option
            : null;
          itemPrice =
            (productOption?.price !== undefined && productOption?.price !== null
              ? productOption.price
              : item.price) || 0;
        }
        return acc + itemPrice * item.quantity;
      }, 0),
    [items]
  );

  const totalAmount = subtotal;

  const handleCheckout = () => {
    router.push("/checkout");
  };

  const [recentlyViewedProductSlugs, setRecentlyViewedProductSlugs] = useState<
    string[]
  >([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<
    IProductInput[]
  >([]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const slugs = JSON.parse(
        localStorage.getItem("recentlyViewedProducts") || "[]"
      ) as string[];
      setRecentlyViewedProductSlugs(slugs);
    }
  }, []);

  React.useEffect(() => {
    if (
      recentlyViewedProductSlugs.length > 0 &&
      recommendedProducts &&
      allCategories
    ) {
      const allProducts = [
        ...recommendedProducts,
        ...items.map((item) => {
          const prod = item.products
            ? (item.products as any as Partial<IProductInput>)
            : undefined;
          return {
            id: item.product_id || prod?.id || "",
            name: prod?.name || "",
            slug: prod?.slug || "",
            category: Array.isArray(prod?.category)
              ? prod.category
              : prod &&
                  "category_ids" in prod &&
                  Array.isArray((prod as any).category_ids)
                ? (prod as any).category_ids
                : [],
            images: Array.isArray(prod?.images) ? prod.images : [],
            tags: Array.isArray(prod?.tags) ? prod.tags : [],
            is_published:
              typeof prod?.is_published === "boolean"
                ? prod.is_published
                : true,
            price: typeof prod?.price === "number" ? prod.price : 0,
            list_price:
              typeof prod?.list_price === "number" ? prod.list_price : 0,
            stockStatus: "in_stock",
            brand: typeof prod?.brand === "string" ? prod.brand : "",
            vendor: prod?.vendor || undefined,
            avg_rating:
              typeof prod?.avg_rating === "number" ? prod.avg_rating : 0,
            num_reviews:
              typeof prod?.num_reviews === "number" ? prod.num_reviews : 0,
            ratingDistribution: Array.isArray(prod?.ratingDistribution)
              ? prod.ratingDistribution
              : [],
            numSales: typeof prod?.numSales === "number" ? prod.numSales : 0,
            countInStock:
              typeof prod?.countInStock === "number" ? prod.countInStock : 0,
            description:
              typeof prod?.description === "string" ? prod.description : "",
            colors: Array.isArray(prod?.colors) ? prod.colors : [],
            options: Array.isArray(prod?.options)
              ? prod.options
              : Array.isArray((prod as any)?.options)
                ? (prod as any).options
                : [],
            reviews: Array.isArray(prod?.reviews) ? prod.reviews : [],
            bundleId: item.bundle_id,
          };
        }),
      ];
      const mappedRecentlyViewedProducts: IProductInput[] = allProducts
        .filter((product: any) =>
          recentlyViewedProductSlugs.includes(product.slug || "")
        )
        .filter(isIProductInput)
        .filter((p) => p.stockStatus === "in_stock");
      const filteredRecentlyViewedProducts =
        mappedRecentlyViewedProducts.filter(
          (rvProduct) =>
            !items.some((cartItem) => cartItem.product_id === rvProduct.id) &&
            !recommendedProducts?.some(
              (recProduct) => recProduct.id === rvProduct.id
            )
        );
      setRecentlyViewedProducts(filteredRecentlyViewedProducts.slice(0, 10));
    }
  }, [recentlyViewedProductSlugs, recommendedProducts, allCategories, items]);

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-white py-4 shadow-sm border-b border-gray-100">
        <Container>
          <CustomBreadcrumb />
        </Container>
      </div>

      <div className="min-h-screen bg-gray-50">
        <Container className="py-10">
          {/* Header */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-5xl text-primary">🛒</span>
              </div>
              <h2 className="text-2xl font-semibold text-primary mb-2">
                Your cart is empty
              </h2>
              <p className="text-muted-foreground mb-8">
                Start adding delicious items to your cart!
              </p>
              <Link href="/">
                <Button className="bg-primary text-primary-foreground px-8 py-3 rounded-xl shadow-lg hover:bg-primary/90 font-semibold">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Cart Items Table */}
              <div className="md:col-span-2">
                {/* Free Shipping Progress Bar */}
                {items.length > 0 &&
                  (() => {
                    const FREE_SHIPPING_THRESHOLD = 50000;
                    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
                    const percent = Math.min(
                      100,
                      (subtotal / FREE_SHIPPING_THRESHOLD) * 100
                    );
                    return (
                      <div
                        className={`rounded border px-4 py-3 mb-8 ${
                          subtotal >= FREE_SHIPPING_THRESHOLD
                            ? "bg-green-50 border-green-200"
                            : "bg-[#FFF5EC] border-[#F0800F]"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">📦</span>
                          {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                            <span className="font-semibold text-green-700">
                              Congratulations! You have unlocked <b>free shipping</b>!
                            </span>
                          ) : (
                            <span className="font-medium text-black">
                              Add{" "}
                              <span className="font-bold text-[#F0800F]">
                                {formatNaira(remaining)}
                              </span>{" "}
                              to cart and get <b>free shipping</b>!
                            </span>
                          )}
                        </div>
                        <div className="w-full h-2 bg-[#FFE1C7] rounded">
                          <div
                            className={`h-2 rounded transition-all duration-300 ${
                              subtotal >= FREE_SHIPPING_THRESHOLD
                                ? "bg-green-500"
                                : "bg-[#F0800F]"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                {/* Desktop Table (hidden on mobile) */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subtotal
                        </th>
                        <th className="px-2 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(groupedItems).map(
                        ([groupKey, productGroup]: [
                          string,
                          GroupedCartItem,
                        ]) => {
                          const optionEntries = Object.entries(
                            productGroup.options
                          );
                          return optionEntries.map(
                            ([optionKey, item]: [string, CartItem], idx) => {
                              const productOption = isProductOption(item.option)
                                ? item.option
                                : null;
                              return (
                                <tr key={item.id}>
                                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-4">
                                    <button
                                      className="text-gray-400 hover:text-red-500 focus:outline-none mr-2"
                                      onClick={() => handleRemoveItem(item)}
                                      aria-label="Remove item"
                                    >
                                      &times;
                                    </button>
                                    <Link
                                      href={`/product/${item.products?.slug || item.bundles?.id}`}
                                    >
                                      <Image
                                        width={60}
                                        height={60}
                                        src={
                                          productOption?.image ||
                                          item.products?.images?.[0] ||
                                          item.bundles?.thumbnail_url ||
                                          "/placeholder.png"
                                        }
                                        alt={
                                          item.products?.name ||
                                          item.bundles?.name ||
                                          "Product image"
                                        }
                                        className="h-14 w-14 rounded border border-gray-200 "
                                      />
                                    </Link>
                                    <div>
                                      <div className="font-semibold text-gray-900 text-sm">
                                        {productOption?.name ||
                                          item.products?.name ||
                                          item.bundles?.name}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                    {formatNaira(
                                      productOption?.price ?? item.price ?? 0
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-7 rounded border border-gray-300 text-gray-700"
                                        onClick={() =>
                                          handleQuantityChange(item, false)
                                        }
                                      >
                                        <AiOutlineMinus className="size-4" />
                                      </Button>
                                      <span className="font-medium text-base text-gray-900">
                                        {item.quantity}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-7 rounded border border-gray-300 text-gray-700"
                                        onClick={() =>
                                          handleQuantityChange(item, true)
                                        }
                                      >
                                        <AiOutlinePlus className="size-4" />
                                      </Button>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                    {formatNaira(
                                      (productOption?.price ??
                                        item.price ??
                                        0) * item.quantity
                                    )}
                                  </td>
                                  <td className="px-2 py-4"></td>
                                </tr>
                              );
                            }
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cart Items (shown only on mobile) */}
                <div className="md:hidden space-y-4">
                  {Object.entries(groupedItems).map(
                    ([groupKey, productGroup]: [string, GroupedCartItem]) => {
                      const optionEntries = Object.entries(productGroup.options);
                      return optionEntries.map(
                        ([optionKey, item]: [string, CartItem]) => {
                          const productOption = isProductOption(item.option)
                            ? item.option
                            : null;
                          return (
                            <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                  <Link
                                    href={`/product/${item.products?.slug || item.bundles?.id}`}
                                    className="shrink-0"
                                  >
                                    <Image
                                      width={80}
                                      height={80}
                                      src={
                                        productOption?.image ||
                                        item.products?.images?.[0] ||
                                        item.bundles?.thumbnail_url ||
                                        "/placeholder.png"
                                      }
                                      alt={
                                        item.products?.name ||
                                        item.bundles?.name ||
                                        "Product image"
                                      }
                                      className="h-16 w-16 rounded border border-gray-200"
                                    />
                                  </Link>
                                  <div>
                                    <div className="font-semibold text-gray-900 text-sm">
                                      {productOption?.name ||
                                        item.products?.name ||
                                        item.bundles?.name}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {formatNaira(
                                        productOption?.price ?? item.price ?? 0
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveItem(item)}
                                  className="text-gray-400 hover:text-red-500"
                                  aria-label="Remove item"
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="flex justify-between items-center mt-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-7 rounded border border-gray-300 text-gray-700"
                                    onClick={() =>
                                      handleQuantityChange(item, false)
                                    }
                                  >
                                    <AiOutlineMinus className="size-4" />
                                  </Button>
                                  <span className="font-medium text-base text-gray-900">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-7 rounded border border-gray-300 text-gray-700"
                                    onClick={() =>
                                      handleQuantityChange(item, true)
                                    }
                                  >
                                    <AiOutlinePlus className="size-4" />
                                  </Button>
                                </div>
                                <div className="text-sm font-semibold">
                                  {formatNaira(
                                    (productOption?.price ?? item.price ?? 0) *
                                      item.quantity
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      );
                    }
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="md:col-span-1">
                <Card className="p-6 bg-white rounded-xl shadow border border-gray-100 sticky top-4">
                  <h2 className="text-xl font-bold text-primary mb-4">
                    Order Summary
                  </h2>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">
                      Subtotal ({totalQuantity} items)
                    </span>
                    <span className="font-semibold text-primary">
                      {formatNaira(subtotal)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-xl text-primary">
                      {formatNaira(subtotal)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mb-4">
                    Delivery fees not included yet.
                  </p>
                  <Button
                    className="w-full text-primary-foreground py-3 mt-2"
                    onClick={handleCheckout}
                    disabled={items.length === 0}
                  >
                    Proceed to Checkout
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {/* Recommended Products */}
          {recommendedProducts && recommendedProducts.length > 0 && (
            <section className="mt-16">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-primary mb-2">
                  Recommended for You
                </h2>
                <p className="text-muted-foreground">
                  Handpicked recommendations just for you
                </p>
              </div>
              <ProductSlider
                title=""
                products={recommendedProducts}
                hideDetails={false}
              />
            </section>
          )}

          {/* Recently Viewed */}
          {recentlyViewedProducts && recentlyViewedProducts.length > 0 && (
            <section className="mt-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-primary mb-2">
                  Recently Viewed
                </h2>
                <p className="text-muted-foreground">
                  Continue where you left off
                </p>
              </div>
              <ProductSlider
                title=""
                products={recentlyViewedProducts}
                hideDetails={false}
              />
            </section>
          )}
        </Container>
      </div>
    </>
  );
};

export default CartClient;