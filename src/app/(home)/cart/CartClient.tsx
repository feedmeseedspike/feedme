"use client";
import React, { useMemo, useCallback, useState, useEffect } from "react";
import { getDealMessages, calculateCartDiscount } from "src/lib/deals";
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
import { useAnonymousCart } from "src/hooks/useAnonymousCart";
import ProductSlider from "@components/shared/product/product-slider";
import { Input } from "@components/ui/input";
import { Separator } from "@components/ui/separator";
import MealPlannerAssistant from "@components/shared/ai/MealPlannerAssistant";
import { CartItem, ProductOption } from "src/lib/actions/cart.actions";
import {
  useRemoveFromCartMutation,
  useCartQuery,
  useUpdateCartItemQuantityMutation,
  useCartSubscription,
} from "src/queries/cart";
import { IProductInput } from "src/types";
import { Tables } from "src/utils/database.types";
import { createClient as createSupabaseClient } from "src/utils/supabase/client";

interface GroupedCartItem {
  product?: CartItem["products"];
  bundle?: CartItem["bundles"];
  offer?: CartItem["offers"];
  options: Record<string, CartItem>;
}

interface CartClientProps {
  user: any | null;
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

const getCartItemLabel = (item: CartItem) =>
  item.products?.name ||
  item.bundles?.name ||
  item.offers?.title ||
  (item as any)?.meta?.name ||
  "Item";

const CartClient: React.FC<CartClientProps> = ({
  user,
  cartItems,
  purchasedProductIds,
  allCategories,
  recommendedProducts,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const anonymousCart = useAnonymousCart();

  // --- QUERY & MUTATIONS ---
  useCartSubscription(); // Subscribe to real-time changes
  const { data: serverCartItems } = useCartQuery();
  const updateItemQuantityMutation = useUpdateCartItemQuantityMutation();
  const removeCartItemMutation = useRemoveFromCartMutation();
  /* updateCartMutation removed (refactored to single item updates) */

  // --- DERIVE ITEMS ---
  // If user is logged in, prefer the client-side query data (which has optimistic updates)
  // Fallback to server-side props if query hasn't loaded (handled by initialData usually, but explicit check good)
  // If anonymous, use the anonymous hook.
  
  const [items, setItems] = useState<CartItem[]>(cartItems);

  useEffect(() => {
    if (user) {
       // When serverCartItems updates (via query fetch or mutation), sync to local state
       if (serverCartItems) {
           setItems(serverCartItems);
       }
    } else {
       // Anonymous user logic handled below or via effect matching existing logic
       // The original code had complex enrichment logic. We need to preserve that.
       // For this refactor, let's keep the enrichment effect but target `items` state.
       if (anonymousCart.items) {
           // trigger enrichment... similar to original
       }
    }
  }, [user, serverCartItems, anonymousCart.items]);

  // Preserve the Anonymous Enrichment Logic (Simplified for brevity in this replacement)
  useEffect(() => {
     if (!user && anonymousCart.items) {
         // ... (existing enrichment logic kept largely same, just ensure it calls setItems)
         // For the sake of this tool use, I will assume the original enrichment logic 
         // is complex and I should try to preserve it or re-implement it carefully.
         // Actually, to avoid breaking it, I'll copy the enrichment logic here.
         
         const enrichItems = async () => {
        const supabase = createSupabaseClient();
        
        try {
          const enriched = await Promise.all(
            anonymousCart.items.map(async (anonItem) => {
              let offerData: any = null;
              let productData: any = null;
              let bundleData: any = null;

              if ((anonItem as any).offer_id) {
                try {
                  const response = await fetch(`/api/offers/${(anonItem as any).offer_id}`);
                  if (response.ok) {
                    const { offer } = await response.json();
                    offerData = offer;
                  }
                } catch (e) {}
              }

              if (anonItem.product_id) {
                try {
                  const { data } = await supabase.from("products").select("id, name, slug, images, price, list_price, is_published").eq("id", anonItem.product_id).single();
                  if (data) productData = data;
                } catch (e) {}
              }

              if (anonItem.bundle_id) {
                 try {
                  const { data } = await supabase.from("bundles").select("id, name, thumbnail_url, price").eq("id", anonItem.bundle_id).single();
                  if (data) bundleData = data;
                } catch (e) {}
              }

              return {
                ...anonItem,
                products: productData,
                bundles: bundleData,
                offers: offerData,
                black_friday_items: null,
                // Ensure mandatory fields exist
                cart_id: null,
                created_at: anonItem.created_at || new Date().toISOString(),
              } as CartItem;
            })
          );
          setItems(enriched);
        } catch (error) {
           console.error("Enrichment error", error);
        }
      };
      enrichItems();
     }
  }, [user, anonymousCart.items]);


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
        } else if (item.offer_id) {
          // Fix logic for offers grouping
          key = `offer-${item.offer_id}`;
          if (!acc[key]) {
            acc[key] = {
              offer: item.offers,
              options: {},
            };
          }
          acc[key].options["offer-item"] = item;
        } else {
             // Fallback for items with no clearly defined relationships (e.g. ad-hoc or corrupt data)
             // We give them a unique key so they are rendered
             key = `unknown-${item.id}`;
             if (!acc[key]) {
                acc[key] = {
                    options: { "default": item }
                }
             }
        }
        return acc;
      },
      {}
    );
  }, [items]);


  // Helper to re-calc local state for instant UI feedback if mutation lags
  const optimisticUpdate = (itemId: string, qty: number) => {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: qty } : i));
  };


  const handleRemoveItem = useCallback(
    async (itemToRemove: CartItem) => {
      try {
        const itemLabel = getCartItemLabel(itemToRemove);
        if (user) {
          if (itemToRemove.id) {
            await removeCartItemMutation.mutateAsync(itemToRemove.id);
            // setItems handled by effect on serverCartItems, but we can optimistically filter locally too
             setItems((prev) => prev.filter((i) => i.id !== itemToRemove.id));
            showToast(`${itemLabel} removed from cart`, "info");
          }
        } else {
          if (itemToRemove.id) {
            anonymousCart.removeItem(itemToRemove.id);
            showToast(`${itemLabel} removed from cart`, "info");
          }
        }
      } catch (error: any) {
        console.error("Failed to remove item:", error);
        showToast("Failed to remove item from cart.", "error");
      }
    },
    [removeCartItemMutation, showToast, user, anonymousCart]
  );

  const handleQuantityChange = useCallback(
    async (itemToUpdate: CartItem, increment: boolean) => {
      const newQuantity = increment
        ? itemToUpdate.quantity + 1
        : itemToUpdate.quantity - 1;

      if (newQuantity < 0) return;

      const itemLabel = getCartItemLabel(itemToUpdate);

      // Optimistic UI update immediately
      optimisticUpdate(itemToUpdate.id, newQuantity);

      if (newQuantity === 0) {
          // Identify removal
          handleRemoveItem(itemToUpdate);
          return;
      }

      if (user) {
         // Authenticated: Use specific item mutation
         try {
             await updateItemQuantityMutation.mutateAsync({
                 cartItemId: itemToUpdate.id,
                 quantity: newQuantity
             });
             // showToast(`${itemLabel} updated`, "success"); // Removed to reduce noise
         } catch (error) {
             console.error("Update failed", error);
             showToast("Failed to update quantity", "error");
             // Revert logic would go here, effectively querying cart again fixes it
         }
      } else {
         // Anonymous
         anonymousCart.updateQuantity(itemToUpdate.id, newQuantity);
         // showToast(`${itemLabel} updated`, "success"); // Removed to reduce noise
      }
    },
    [items, updateItemQuantityMutation, removeCartItemMutation, showToast, user, anonymousCart]
  );

  const totalQuantity = useMemo(() => {
     return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      let itemPrice = 0;
      if (item.offer_id && item.offers) {
        itemPrice = item.offers.price_per_slot || 0;
      } else if (item.bundle_id && item.bundles) {
        itemPrice = item.bundles.price || 0;
      } else if (item.product_id && item.products) {
        const productOption = isProductOption(item.option) ? item.option : null;
        itemPrice =
          (productOption?.price !== undefined && productOption?.price !== null
            ? productOption.price
            : item.price) || 0;
      } else {
        itemPrice = item.price || 0;
      }
      return acc + itemPrice * item.quantity;
    }, 0);
  }, [items]);

  const dealMessages = useMemo(() => getDealMessages(subtotal, items), [subtotal, items]);
  const dealsDiscount = useMemo(() => calculateCartDiscount(subtotal, items), [subtotal, items]);

  const totalAmount = Math.max(0, subtotal - dealsDiscount);

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
          {totalQuantity === 0 ? (
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
                <Button className="bg-[#1B6013] text-primary-foreground px-8 py-3 rounded-xl shadow-lg hover:bg-[#1B6013]/90 font-semibold">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Cart Items Table */}
              <div className="md:col-span-2">
                
                {/* Deal Messages */}
                {/* Deal Messages - Commented out as requested
                {dealMessages.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {dealMessages.map((msg, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-[#F2FCE2] text-[#1B6013] border border-[#1B6013]/20 rounded-xl shadow-sm">
                        <span className="text-xl">🎉</span>
                        <p className="font-medium text-sm md:text-base">{msg}</p>
                      </div>
                    ))}
                  </div>
                )}
                */}

                {/* Free Delivery Progress Bar */}
                {/* Free Delivery Progress Bar - Minimal Design */}
                {totalQuantity > 0 &&
                  (() => {
                    const FREE_SHIPPING_THRESHOLD = 50000;
                    const remaining = Math.max(
                      0,
                      FREE_SHIPPING_THRESHOLD - subtotal
                    );
                    const percent = Math.min(
                      100,
                      (subtotal / FREE_SHIPPING_THRESHOLD) * 100
                    );
                    return (
                      <div className="mb-10">
                        <div className="flex items-center justify-between mb-3 text-sm">
                          {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                            <span className="font-medium text-green-700">
                             You&apos;ve unlocked <b>Free Delivery</b>
                            </span>
                          ) : (
                            <span className="text-gray-600">
                              Add <span className="font-semibold text-primary">{formatNaira(remaining)}</span> for <span className="font-semibold text-black">Free Delivery</span>
                            </span>
                          )}
                          <span className="text-gray-400 text-xs">{Math.round(percent)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ease-out ${
                              subtotal >= FREE_SHIPPING_THRESHOLD
                                ? "bg-green-600"
                                : "bg-primary"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                {/* Desktop Table (hidden on mobile) */}
                <div className="hidden md:block">
                  <table className="min-w-full">
                    <thead className="border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Product
                        </th>
                        <th className="px-6 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Price
                        </th>
                        <th className="px-6 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Quantity
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Total
                        </th>
                        <th className="px-2 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {Object.entries(groupedItems).map(
                        ([groupKey, productGroup]: [
                          string,
                          any,
                        ]) => {
                          const optionEntries = Object.entries(
                            productGroup.options
                          );
                          return optionEntries.map(
                            ([optionKey, item]: [string, any], idx) => {
                              const productOption = isProductOption(item.option)
                                ? item.option
                                : null;
                              return (
                                <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-6 whitespace-nowrap">
                                    <div className="flex items-center gap-5">
                                      <Link
                                        href={`/product/${item.products?.slug || item.bundles?.id}`}
                                        className="shrink-0 relative"
                                      >
                                        <Image
                                          width={80}
                                          height={80}
                                          src={
                                            productOption?.image ||
                                            item.products?.images?.[0] ||
                                            (item as any)?.meta?.image ||
                                            item.bundles?.thumbnail_url ||
                                            item.offers?.image_url ||
                                            "/product-placeholder.png"
                                          }
                                          alt={
                                            item.products?.name ||
                                            item.bundles?.name ||
                                            item.offers?.title ||
                                            "Product image"
                                          }
                                          className="h-16 w-16 rounded-lg object-cover bg-gray-50 border border-black/5"
                                        />
                                      </Link>
                                      <div>
                                        <div className="font-medium text-gray-900 text-sm">
                                          {(item.products?.name ||
                                            item.bundles?.name ||
                                            item.offers?.title ||
                                            (item as any)?.meta?.name ||
                                            "Product") +
                                            (productOption?.name
                                              ? ` - ${productOption.name}`
                                              : "")}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-6 whitespace-nowrap text-center text-sm text-gray-600 font-medium">
                                    {formatNaira(
                                      productOption?.price ??
                                        (item.offers?.price_per_slot ||
                                          item.price) ??
                                        0
                                    )}
                                  </td>
                                  <td className="px-6 py-6 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-3">
                                      <button
                                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                                        onClick={() =>
                                          handleQuantityChange(item, false)
                                        }
                                      >
                                        <AiOutlineMinus className="size-3" />
                                      </button>
                                      <span className="font-medium text-sm text-gray-900 w-4 text-center">
                                        {item.quantity}
                                      </span>
                                      <button
                                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                                        onClick={() =>
                                          handleQuantityChange(item, true)
                                        }
                                      >
                                        <AiOutlinePlus className="size-3" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                    {formatNaira(
                                      (productOption?.price ??
                                        item.price ??
                                        0) * item.quantity
                                    )}
                                  </td>
                                  <td className="px-2 py-6 text-right">
                                    <button
                                      className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                      onClick={() => handleRemoveItem(item)}
                                      aria-label="Remove item"
                                    >
                                      <Trash2Icon className="size-4" />
                                    </button>
                                  </td>
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
                <div className="md:hidden">
                  <div className="divide-y divide-gray-100">
                    {Object.entries(groupedItems).map(
                      ([groupKey, productGroup]: [string, any]) => {
                        const optionEntries = Object.entries(
                          productGroup.options
                        );
                        return optionEntries.map(
                          ([optionKey, item]: [string, any]) => {
                            const productOption = isProductOption(item.option)
                              ? item.option
                              : null;
                            return (
                              <div
                                key={item.id}
                                className="py-6 first:pt-0"
                              >
                                <div className="flex gap-4">
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
                                        (item as any)?.meta?.image ||
                                        item.bundles?.thumbnail_url ||
                                        item.offers?.image_url ||
                                        "/product-placeholder.png"
                                      }
                                      alt={
                                        item.products?.name ||
                                        item.bundles?.name ||
                                        item.offers?.title ||
                                        "Product image"
                                      }
                                      className="h-24 w-24 rounded-lg object-cover bg-gray-50"
                                    />
                                  </Link>
                                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="font-medium text-gray-900 text-sm line-clamp-2">
                                          {(item.products?.name ||
                                            item.bundles?.name ||
                                            item.offers?.title ||
                                            (item as any)?.meta?.name ||
                                            "Product") +
                                            (productOption?.name
                                              ? ` - ${productOption.name}`
                                              : "")}
                                        </div>
                                        <button
                                          onClick={() => handleRemoveItem(item)}
                                          className="text-gray-400 hover:text-red-500 shrink-0 p-1"
                                          aria-label="Remove item"
                                        >
                                          <Trash2Icon className="size-4" />
                                        </button>
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        {formatNaira(
                                          productOption?.price ??
                                            (item.offers?.price_per_slot ||
                                              item.price) ??
                                            0
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-3">
                                      <div className="flex items-center gap-3">
                                        <button
                                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                                          onClick={() =>
                                            handleQuantityChange(item, false)
                                          }
                                        >
                                          <AiOutlineMinus className="size-3" />
                                        </button>
                                        <span className="font-medium text-sm text-gray-900 w-4 text-center">
                                          {item.quantity}
                                        </span>
                                        <button
                                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                                          onClick={() =>
                                            handleQuantityChange(item, true)
                                          }
                                        >
                                          <AiOutlinePlus className="size-3" />
                                        </button>
                                      </div>
                                      <div className="text-sm font-semibold text-gray-900">
                                        {formatNaira(
                                          (productOption?.price ??
                                            (item.offers?.price_per_slot ||
                                              item.price) ??
                                            0) * item.quantity
                                        )}
                                      </div>
                                    </div>
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
              </div>

              {/* Order Summary */}
              <div className="md:col-span-1">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sticky top-24">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 font-primary">
                    Order Summary
                  </h2>
                    <div className="space-y-4 text-sm font-medium">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal ({totalQuantity} items)</span>
                        <span className="text-gray-900">
                          {formatNaira(subtotal)}
                        </span>
                      </div>
                      {dealsDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-{formatNaira(dealsDiscount)}</span>
                        </div>
                      )}
                    </div>
                    <Separator className="my-6 bg-gray-100" />
                    <div className="flex justify-between items-end mb-8">
                      <span className="text-base text-gray-600 font-medium pb-0.5">Total</span>
                      <span className="font-bold text-2xl text-gray-900">
                        {formatNaira(totalAmount)}
                      </span>
                    </div>
                  <Button
                    className="w-full h-12 bg-[#1B6013] hover:bg-[#154d0f] text-white rounded-xl font-medium tracking-wide shadow-lg shadow-[#1B6013]/20 transition-all hover:shadow-[#1B6013]/30 hover:-translate-y-0.5"
                    onClick={handleCheckout}
                    disabled={totalQuantity === 0}
                  >
                    Proceed to Checkout
                  </Button>
                  <p className="text-center text-xs text-gray-400 mt-4">
                    Taxes and shipping calculated at checkout
                  </p>
                </div>
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
