"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";
import {
  useCartQuery,
  useUpdateCartMutation,
  useRemoveFromCartMutation,
  cartQueryKey,
} from "src/queries/cart";
import { useUser } from "src/hooks/useUser";
import { useAnonymousCart } from "src/hooks/useAnonymousCart";
import { Loader2 } from "lucide-react";
import { showToast } from "src/lib/utils";
import { Json } from "src/utils/database.types";
import { ProductOption, type CartItem } from "src/lib/actions/cart.actions";
import { ItemToUpdateMutation } from "src/queries/cart";
import { Trash2, Minus, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@components/ui/sheet";
import { useMediaQuery } from "usehooks-ts";
import { createPortal } from "react-dom";

const serializeOptionValue = (value: any) => JSON.stringify(value ?? null);

interface AddToCartProps {
  item: {
    id: string;
    name: string;
    slug: string;
    category: string;
    price: number;
    images: string[];
    countInStock?: number | null;
    options?: ProductOption[];
    selectedOption?: string;
    option?: ProductOption | null;
    customizations?: Record<string, string>;
    onOutOfStock?: () => void;
    iconOnly?: boolean;
    bundleId?: string;
    in_season?: boolean | null; // <-- add this
  };
  blackFridayItem?: {
    id: string;
    title?: string | null;
    price: number;
    availableSlots?: number | null;
    maxQuantityPerUser?: number | null;
    quantityLimit?: number | null;
  };
  minimal?: boolean;
  className?: string;
  onAddToCart?: () => void;
  onError?: () => void;
  onAuthRequired?: () => void;
}

const AddToCart = React.memo(
  ({
    item,
    blackFridayItem,
    minimal = false,
    className,
    onAddToCart,
    onError,
    onAuthRequired,
  }: AddToCartProps) => {
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [missingOption, setMissingOption] = useState(false);
    const [showQuantityControls, setShowQuantityControls] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const { data: cartItems, isLoading: isCartLoading } = useCartQuery();
    const { user } = useUser();
    const anonymousCart = useAnonymousCart();

    const updateCartMutation = useUpdateCartMutation();
    const removeCartItemMutation = useRemoveFromCartMutation();
    const queryClient = useQueryClient();

    const [effectiveOption, setEffectiveOption] =
      useState<ProductOption | null>(null);
    const [optionPickerOpen, setOptionPickerOpen] = useState(false);
    const availableOptions = item.options || [];
    const optionPickerEnabled = availableOptions.length > 1;
    const requiresOptionSelection = optionPickerEnabled && !effectiveOption;

    useEffect(() => {
      setEffectiveOption(item.option ?? null);
    }, [item.id, item.option]);

    useEffect(() => {
      setIsClient(true);
    }, []);

    const formatItemLabel = useCallback(
      (overrideOption?: ProductOption | null) => {
        const optionSource =
          overrideOption ?? effectiveOption ?? item.option ?? null;
        return `${item.name}${
          optionSource?.name ? ` (${optionSource.name})` : ""
        }`;
      },
      [item.name, effectiveOption, item.option]
    );
    const productImageSrc = useMemo(() => {
      if (Array.isArray(item.images) && item.images.length > 0) {
        const first = item.images[0] as any;
        if (typeof first === "string") return first;
        if (first && typeof first === "object" && "url" in first) {
          return first.url;
        }
      }
      return "/images/placeholder-banner.jpg";
    }, [item.images]);

    const buildCombinedOption = useCallback(
      (optionOverride?: ProductOption | null) => {
        const optionSource =
          optionOverride ?? effectiveOption ?? item.option ?? null;

        if (!optionSource && !item.customizations) return null;

        const baseOption = optionSource ? { ...optionSource } : {};
        const customizationsData =
          item.customizations && Object.keys(item.customizations).length > 0
            ? { customizations: item.customizations }
            : {};

        return Object.keys(baseOption).length > 0 ||
          Object.keys(customizationsData).length > 0
          ? { ...baseOption, ...customizationsData }
          : null;
      },
      [effectiveOption, item.customizations, item.option]
    );

    const combinedOption = useMemo(
      () => buildCombinedOption(),
      [buildCombinedOption]
    );

    const getUnitPrice = useCallback(
      (optionOverride?: ProductOption | null) => {
        if (blackFridayItem) return blackFridayItem.price;
        const optionSource =
          optionOverride ?? effectiveOption ?? item.option ?? null;
        const optionPrice =
          optionSource && typeof optionSource.price === "number"
            ? optionSource.price
            : undefined;
        return optionPrice ?? item.price;
      },
      [blackFridayItem, effectiveOption, item.option, item.price]
    );

    const resolvedMaxQuantity = useMemo(() => {
      const limits: number[] = [];
      if (typeof item.countInStock === "number" && item.countInStock > 0) {
        limits.push(item.countInStock);
      }
      if (
        blackFridayItem?.availableSlots &&
        blackFridayItem.availableSlots > 0
      ) {
        limits.push(blackFridayItem.availableSlots);
      }
      if (blackFridayItem?.quantityLimit && blackFridayItem.quantityLimit > 0) {
        limits.push(blackFridayItem.quantityLimit);
      }
      if (
        blackFridayItem?.maxQuantityPerUser &&
        blackFridayItem.maxQuantityPerUser > 0
      ) {
        limits.push(blackFridayItem.maxQuantityPerUser);
      }
      return limits.length > 0 ? Math.min(...limits) : 100;
    }, [item.countInStock, blackFridayItem]);

    const bundleIdentifier = useMemo(
      () => item.bundleId ?? null,
      [item.bundleId]
    );

    const productIdentifierForCart = useMemo(
      () => (bundleIdentifier ? null : item.id),
      [bundleIdentifier, item.id]
    );

    const blackFridayIdentifier = blackFridayItem?.id ?? null;

    const matchesCartEntry = useCallback(
      (
        cartItem: {
          bundle_id?: string | null;
          product_id?: string | null;
          option?: any | null;
          black_friday_item_id?: string | null;
        },
        optionOverride?: any | null
      ) => {
        if (bundleIdentifier) {
          const cartBundleId =
            cartItem.bundle_id !== undefined && cartItem.bundle_id !== null
              ? String(cartItem.bundle_id)
              : null;
          return cartBundleId === String(bundleIdentifier);
        }

        const targetSignature =
          optionOverride !== undefined
            ? serializeOptionValue(optionOverride)
            : serializeOptionValue(combinedOption);

        return (
          cartItem.product_id === productIdentifierForCart &&
          serializeOptionValue(cartItem.option) === targetSignature &&
          (cartItem.black_friday_item_id ?? null) === blackFridayIdentifier
        );
      },
      [
        bundleIdentifier,
        combinedOption,
        productIdentifierForCart,
        blackFridayIdentifier,
      ]
    );

    const currentCartItem = useMemo(() => {
      // CRITICAL: Use query cache for authenticated users to get optimistic updates
      // For bundles, we need the most up-to-date data to avoid showing quantity controls on all bundles
      const cachedCartData = queryClient.getQueryData<CartItem[]>(cartQueryKey);
      const sourceItems = user
        ? cachedCartData !== undefined &&
          cachedCartData !== null &&
          Array.isArray(cachedCartData)
          ? cachedCartData
          : cartItems || []
        : anonymousCart.items;

      // For bundles, we must match EXACTLY by bundle_id - no fallbacks
      // This ensures only the specific bundle that's in the cart shows quantity controls
      if (bundleIdentifier) {
        const bundleMatch = sourceItems.find((cartItem) => {
          // Strict matching: bundle_id must exist and match exactly
          if (!cartItem.bundle_id) return false;
          return String(cartItem.bundle_id) === String(bundleIdentifier);
        });
        // Only return if we found THIS specific bundle - no fallbacks
        return bundleMatch || undefined;
      }

      // For products, use exact match with option and black friday
      const exactMatch = sourceItems.find((cartItem) =>
        matchesCartEntry(cartItem)
      );
      if (exactMatch) return exactMatch;

      // Don't fall back to any product match - we need exact matches only
      return undefined;
    }, [
      user,
      cartItems,
      anonymousCart.items,
      matchesCartEntry,
      bundleIdentifier,
      queryClient,
    ]);

    useEffect(() => {
      if (updateCartMutation.isPending) return;
      // For bundles, only show quantity controls if THIS specific bundle is in cart
      // For products, show if the exact product+option+blackfriday combo is in cart
      const shouldShowControls = bundleIdentifier
        ? currentCartItem !== undefined &&
          currentCartItem !== null &&
          currentCartItem.bundle_id === bundleIdentifier
        : Boolean(currentCartItem);

      setQuantity(currentCartItem?.quantity ?? 1);
      setShowQuantityControls(shouldShowControls);

      // Debug logging for bundles
      if (process.env.NODE_ENV === "development" && bundleIdentifier) {
        console.log(`Bundle ${bundleIdentifier}:`, {
          inCart: currentCartItem !== undefined && currentCartItem !== null,
          bundleId: currentCartItem?.bundle_id,
          expectedBundleId: bundleIdentifier,
          quantity: currentCartItem?.quantity,
          showControls: shouldShowControls,
        });
      }
    }, [currentCartItem, updateCartMutation.isPending, bundleIdentifier]);

    const getQuantityForOption = useCallback(
      (option?: ProductOption | null) => {
        const combinedForLookup = buildCombinedOption(option ?? null);

        if (user) {
          const match = (cartItems || []).find((cartItem) =>
            matchesCartEntry(cartItem, combinedForLookup)
          );
          return match?.quantity ?? 0;
        }

        const anonMatch = anonymousCart.items.find((cartItem) =>
          matchesCartEntry(cartItem, combinedForLookup)
        );
        return anonMatch?.quantity ?? 0;
      },
      [
        anonymousCart.items,
        buildCombinedOption,
        cartItems,
        matchesCartEntry,
        user,
      ]
    );

    useEffect(() => {
      if (!optionPickerEnabled) return;
      if (effectiveOption) return;
      if (!currentCartItem?.option) return;
      if (typeof currentCartItem.option === "object") {
        setEffectiveOption(currentCartItem.option as ProductOption);
      }
    }, [
      optionPickerEnabled,
      effectiveOption,
      currentCartItem,
      setEffectiveOption,
    ]);

    const handleQuantityChange = useCallback(
      async (
        newQuantity: number,
        optionOverride?: ProductOption | null,
        combinedOverride?: Json | null
      ) => {
        const targetOption = optionOverride ?? effectiveOption ?? null;
        const combinedForAction =
          combinedOverride ?? buildCombinedOption(optionOverride ?? null);

        const stockLimit =
          typeof item.countInStock === "number" && item.countInStock > 0
            ? item.countInStock
            : null;
        const enforcedLimit = blackFridayItem
          ? resolvedMaxQuantity
          : stockLimit;
        let requestedQuantity = Math.max(0, Math.floor(newQuantity));
        if (
          enforcedLimit &&
          enforcedLimit > 0 &&
          requestedQuantity > enforcedLimit
        ) {
          requestedQuantity = enforcedLimit;
          showToast(
            `You can only add up to ${enforcedLimit} of ${formatItemLabel(
              targetOption
            )} right now.`,
            "info"
          );
        }

        if (!user) {
          // Handle anonymous cart
          if (requestedQuantity === 0) {
            const existingAnonymousItem = anonymousCart.items.find((cartItem) =>
              matchesCartEntry(cartItem, combinedForAction)
            );
            if (existingAnonymousItem) {
              anonymousCart.removeItem(existingAnonymousItem.id);
              showToast(
                `${formatItemLabel(targetOption)} removed from cart`,
                "info"
              );
            }
          } else {
            const existingAnonymousItem = anonymousCart.items.find((cartItem) =>
              matchesCartEntry(cartItem, combinedForAction)
            );
            if (existingAnonymousItem) {
              anonymousCart.updateQuantity(
                existingAnonymousItem.id,
                requestedQuantity
              );
            } else {
              anonymousCart.addItem(
                productIdentifierForCart,
                requestedQuantity,
                getUnitPrice(targetOption),
                combinedForAction as ProductOption | null,
                bundleIdentifier,
                null,
                {
                  name: item.name,
                  slug: item.slug,
                  image: Array.isArray(item.images)
                    ? typeof item.images[0] === "string"
                      ? item.images[0]
                      : undefined
                    : undefined,
                },
                blackFridayIdentifier
              );
            }
            setQuantity(requestedQuantity);
            setShowQuantityControls(requestedQuantity > 0);
            window.dispatchEvent(new Event("anonymousCartUpdated"));
          }
          return;
        }
        if (requestedQuantity < 0) return;

        // CRITICAL: Get the most up-to-date cart data
        // Priority: 1) Query cache (includes optimistic updates), 2) Query data
        // We MUST have the complete cart before mutating, otherwise the RPC will delete items
        const cachedCartData =
          queryClient.getQueryData<CartItem[]>(cartQueryKey);
        let currentCartItems: CartItem[] = [];

        // Use cache if it exists and is valid (includes optimistic updates from previous mutations)
        if (
          cachedCartData !== undefined &&
          cachedCartData !== null &&
          Array.isArray(cachedCartData)
        ) {
          currentCartItems = cachedCartData;
        }
        // Fall back to query data if cache is empty/null and query has loaded
        else if (!isCartLoading && Array.isArray(cartItems)) {
          currentCartItems = cartItems;
        }
        // If cart is still loading and we have no valid cached data, we must wait
        // Otherwise we'll send an incomplete array and delete existing items
        else if (isCartLoading) {
          const hasValidCache =
            cachedCartData !== undefined &&
            cachedCartData !== null &&
            Array.isArray(cachedCartData);
          if (
            !hasValidCache ||
            (hasValidCache && (cachedCartData as CartItem[]).length === 0)
          ) {
            showToast("Please wait, loading cart...", "info");
            return;
          }
          // If we have valid cache with items, use it
          currentCartItems = cachedCartData as CartItem[];
        }
        // If we have no data at all and cart isn't loading, it's likely empty (first item)
        // This is okay - we'll just send the new item
        const existingItemInCart = currentCartItems.find((cartItem) =>
          matchesCartEntry(cartItem, combinedForAction)
        );
        if (requestedQuantity === 0) {
          if (existingItemInCart?.id) {
            try {
              await removeCartItemMutation.mutateAsync(existingItemInCart.id);
              showToast(
                `${formatItemLabel(targetOption)} removed from cart`,
                "info"
              );
            } catch (error: any) {
              console.error("Failed to remove item:", error);
              if (error.message?.includes("You must be logged in")) {
                onAuthRequired?.();
              } else {
                showToast(
                  error.message ||
                    `Couldn't remove ${formatItemLabel(
                      targetOption
                    )} from cart.`,
                  "error"
                );
              }
            }
          }
        } else {
          setQuantity(requestedQuantity);
          setShowQuantityControls(true);
          try {
            // Build mutation array from current cart items
            // CRITICAL: The RPC function deletes ALL items and inserts only what we send
            // So we MUST include ALL existing items, only updating the target item's quantity
            const itemsForMutation: ItemToUpdateMutation[] = currentCartItems
              .map((cartItem: CartItem) => {
                const isTargetItem = matchesCartEntry(
                  cartItem,
                  combinedForAction
                );

                // Properly serialize option - handle both object and already-serialized cases
                let serializedOption: Json | null = null;
                if (cartItem.option) {
                  if (typeof cartItem.option === "object") {
                    // Deep clone to avoid reference issues
                    serializedOption = JSON.parse(
                      JSON.stringify(cartItem.option)
                    ) as Json;
                  } else {
                    // Already serialized or null
                    serializedOption = cartItem.option as Json;
                  }
                }

                return {
                  product_id: cartItem.product_id || null,
                  bundle_id: cartItem.bundle_id || null,
                  offer_id: cartItem.offer_id || null,
                  black_friday_item_id:
                    (cartItem as any).black_friday_item_id || null,
                  option: serializedOption,
                  quantity: isTargetItem
                    ? requestedQuantity
                    : cartItem.quantity,
                  price:
                    cartItem.option &&
                    typeof cartItem.option === "object" &&
                    "price" in cartItem.option
                      ? ((cartItem.option as any).price ?? cartItem.price ?? 0)
                      : (cartItem.price ?? 0),
                };
              })
              .filter((item) => item.quantity > 0);

            // Check if target item exists in mutation array
            // For bundles, check by bundle_id only
            // For products, check by product_id + option + black_friday
            const targetItemExists = bundleIdentifier
              ? itemsForMutation.some(
                  (item) =>
                    item.bundle_id &&
                    String(item.bundle_id) === String(bundleIdentifier)
                )
              : itemsForMutation.some((item) => {
                  const sameProduct =
                    item.product_id === productIdentifierForCart;
                  const sameOption =
                    serializeOptionValue(item.option) ===
                    serializeOptionValue(combinedForAction);
                  const sameBlackFriday =
                    (item.black_friday_item_id ?? null) ===
                    blackFridayIdentifier;
                  return sameProduct && sameOption && sameBlackFriday;
                });

            // Debug: Log what we're sending to catch any issues
            if (process.env.NODE_ENV === "development") {
              console.log(
                "Cart mutation - Items count:",
                itemsForMutation.length,
                "Target exists:",
                targetItemExists,
                bundleIdentifier
                  ? `Bundle ID: ${bundleIdentifier}`
                  : `Product ID: ${productIdentifierForCart}`,
                "Current cart items count:",
                currentCartItems.length,
                "Items in mutation:",
                itemsForMutation.map((item) => ({
                  bundle_id: item.bundle_id,
                  product_id: item.product_id,
                  quantity: item.quantity,
                })),
                "Current cart items:",
                currentCartItems.map((item) => ({
                  bundle_id: item.bundle_id,
                  product_id: item.product_id,
                  quantity: item.quantity,
                }))
              );
            }
            if (!targetItemExists) {
              // Serialize the option properly for the new item
              let serializedNewOption: Json | null = null;
              if (combinedForAction && typeof combinedForAction === "object") {
                serializedNewOption = JSON.parse(
                  JSON.stringify(combinedForAction)
                ) as Json;
              }

              itemsForMutation.push({
                product_id: productIdentifierForCart,
                bundle_id: bundleIdentifier,
                offer_id: null,
                black_friday_item_id: blackFridayIdentifier,
                option: serializedNewOption,
                quantity: requestedQuantity,
                price: getUnitPrice(targetOption),
              });
            }
            await updateCartMutation.mutateAsync(itemsForMutation);
            // Don't invalidate here - let the mutation's onSuccess handle it
            // This prevents race conditions where the refetch happens before DB commit
            onAddToCart?.();
          } catch (error: any) {
            console.error("Failed to update cart:", error);
            if (error.message?.includes("You must be logged in")) {
              onAuthRequired?.();
            } else {
              showToast(
                error.message ||
                  `Couldn't update ${formatItemLabel(targetOption)} in cart.`,
                "error"
              );
              onError?.();
            }
          }
        }
      },
      [
        user,
        cartItems,
        anonymousCart,
        onAuthRequired,
        buildCombinedOption,
        item.name,
        item.countInStock,
        item.images,
        item.slug,
        removeCartItemMutation,
        updateCartMutation,
        onAddToCart,
        onError,
        formatItemLabel,
        queryClient,
        matchesCartEntry,
        productIdentifierForCart,
        bundleIdentifier,
        effectiveOption,
        blackFridayItem,
        blackFridayIdentifier,
        resolvedMaxQuantity,
        getUnitPrice,
        isCartLoading,
      ]
    );

    const handleIncrement = useCallback(() => {
      const maxQuantity = blackFridayItem
        ? resolvedMaxQuantity
        : item.countInStock || 100;
      handleQuantityChange(
        Math.min(quantity + 1, maxQuantity),
        effectiveOption ?? null
      );
    }, [
      blackFridayItem,
      resolvedMaxQuantity,
      item.countInStock,
      handleQuantityChange,
      quantity,
      effectiveOption,
    ]);

    const handleDecrement = useCallback(() => {
      handleQuantityChange(quantity - 1, effectiveOption ?? null);
    }, [handleQuantityChange, quantity, effectiveOption]);

    const handleAddToCartClick = useCallback(
      async (
        bypassOptionRequirement = false,
        optionOverride?: ProductOption | null
      ) => {
        const actionOption = optionOverride ?? effectiveOption ?? item.option;
        const combinedForAction = buildCombinedOption(optionOverride ?? null);

        if (!bypassOptionRequirement && requiresOptionSelection) {
          setOptionPickerOpen(true);
          return;
        }

        try {
          if (
            blackFridayItem &&
            blackFridayItem.availableSlots !== null &&
            blackFridayItem.availableSlots !== undefined &&
            blackFridayItem.availableSlots <= 0
          ) {
            showToast(
              `${blackFridayItem.title || item.name} is sold out.`,
              "error"
            );
            return;
          }
          if (
            item.countInStock !== null &&
            item.countInStock !== undefined &&
            item.countInStock <= 0
          ) {
            showToast(
              `${formatItemLabel(actionOption)} is out of stock`,
              "error"
            );
            return;
          }
          if (
            item.options &&
            item.options.length > 0 &&
            !actionOption &&
            (item.selectedOption === undefined ||
              item.selectedOption === null ||
              item.selectedOption === "")
          ) {
            setMissingOption(true);
            setTimeout(() => setMissingOption(false), 500);
            showToast(
              `Please choose an option for ${item.name} before adding it to your cart`,
              "error"
            );
            onError?.();
            return;
          }

          const existingQty = getQuantityForOption(actionOption ?? null);
          if (
            blackFridayItem?.maxQuantityPerUser &&
            existingQty >= blackFridayItem.maxQuantityPerUser
          ) {
            showToast(
              `Limit reached. You can only buy ${blackFridayItem.maxQuantityPerUser} of ${formatItemLabel(
                actionOption
              )}.`,
              "info"
            );
            return;
          }

          const nextQuantity = existingQty > 0 ? existingQty + 1 : 1;
          await handleQuantityChange(
            nextQuantity,
            actionOption ?? null,
            combinedForAction
          );
          return;
        } catch (error: any) {
          console.error("Failed to add to cart:", error);
          if (error.message?.includes("You must be logged in")) {
            onAuthRequired?.();
          } else {
            showToast(
              error.message ||
                `Failed to add ${formatItemLabel(actionOption)} to cart.`,
              "error"
            );
            onError?.();
          }
        }
      },
      [
        requiresOptionSelection,
        onAuthRequired,
        item.countInStock,
        item.options,
        item.selectedOption,
        item.name,
        onError,
        blackFridayItem,
        formatItemLabel,
        effectiveOption,
        item.option,
        buildCombinedOption,
        getQuantityForOption,
        handleQuantityChange,
      ]
    );

    const isInCart = Boolean(currentCartItem);
    const isOutOfSeason = item.in_season === false;

    // Only consider out of stock if countInStock is explicitly set to a number <= 0
    const isOutOfStock =
      (typeof item.countInStock === "number" && item.countInStock <= 0) ||
      (blackFridayItem?.availableSlots !== undefined &&
        blackFridayItem.availableSlots !== null &&
        blackFridayItem.availableSlots <= 0);

    const isMinimalDisabled =
      isOutOfSeason || isOutOfStock || updateCartMutation.isPending;

    const handleOptionSelect = useCallback(
      (option: ProductOption) => {
        setEffectiveOption(option);
        const existingQuantity = getQuantityForOption(option);
        if (existingQuantity > 0) {
          setQuantity(existingQuantity);
          setShowQuantityControls(true);
        } else {
          setQuantity(1);
          setShowQuantityControls(false);
        }
      },
      [getQuantityForOption]
    );

    if (user && isCartLoading && !minimal) {
      return (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>{" "}
          {/* Placeholder for 'Quantity' label */}
          <div className="flex items-center">
            <div className="size-8 bg-gray-200 rounded-full animate-pulse mr-2"></div>{" "}
            {/* Placeholder for minus button */}
            <div className="w-12 h-8 bg-gray-200 rounded animate-pulse"></div>{" "}
            {/* Placeholder for quantity display */}
            <div className="size-8 bg-gray-200 rounded-full animate-pulse ml-2"></div>{" "}
            {/* Placeholder for plus button */}
          </div>
          <div className="h-12 bg-gray-200 rounded animate-pulse w-full"></div>{" "}
          {/* Placeholder for 'Buy Now' button */}
          <div className="h-12 bg-gray-200 rounded animate-pulse w-full"></div>{" "}
          {/* Placeholder for 'Add to Cart' button */}
        </div>
      ); // Skeleton loader for AddToCart component
    }

    const optionList = (
      <div className="space-y-3">
        {availableOptions.map((option, idx) => {
          const isSelected = effectiveOption?.name === option.name;
          const formattedPrice =
            typeof option.price === "number"
              ? Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                }).format(option.price)
              : "Select";
          return (
            <div key={option.name} className="space-y-3">
              <motion.button
                onClick={() => handleOptionSelect(option)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={clsx(
                  "w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                  isSelected
                    ? "border-[#1B6013] bg-[#F5FFF1] shadow-[0_10px_30px_rgba(27,96,19,0.08)]"
                    : "border-[#E4E7EC] bg-white hover:border-[#1B6013] hover:bg-[#F5FFF1]"
                )}
              >
                <span className="font-medium text-sm text-[#101828]">
                  {option.name}
                </span>
                <span className="text-sm text-[#475467]">{formattedPrice}</span>
              </motion.button>
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-2xl border border-[#E4E7EC] bg-[#F9FAFB] p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {option.name}
                      </p>
                      <p className="text-xs text-[#475467]">{formattedPrice}</p>
                    </div>
                    {showQuantityControls && quantity > 0 && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#F04438]"
                        onClick={() => handleQuantityChange(0, option)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.3em] text-[#9CA3AF]">
                      Quantity
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="size-9 rounded-full bg-white border border-[#E4E7EC] flex items-center justify-center text-lg text-[#1B6013]"
                        onClick={() =>
                          handleQuantityChange(
                            Math.max(getQuantityForOption(option) - 1, 0),
                            option
                          )
                        }
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-semibold text-[#0F172A]">
                        {getQuantityForOption(option) || quantity}
                      </span>
                      <button
                        type="button"
                        className="size-9 rounded-full bg-[#1B6013] text-white flex items-center justify-center text-lg"
                        onClick={() =>
                          handleQuantityChange(
                            (getQuantityForOption(option) || quantity) + 1,
                            option
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-2xl bg-[#1B6013] text-white py-3 font-semibold shadow-[0px_15px_35px_rgba(27,96,19,0.32)]"
                    onClick={() => {
                      const ensuredQuantity =
                        getQuantityForOption(option) || quantity;
                      handleQuantityChange(
                        Math.max(ensuredQuantity, 1),
                        option
                      );
                      setOptionPickerOpen(false);
                    }}
                  >
                    {showQuantityControls && quantity > 0
                      ? "Update Cart"
                      : "Add to Cart"}
                  </button>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    );

    const desktopDrawerVariants: Variants = {
      open: {
        x: 0,
        opacity: 1,
        transition: { type: "spring", damping: 26, stiffness: 280 },
      },
      closed: {
        x: 56,
        opacity: 0,
        transition: {
          duration: 0.26,
          ease: [0.4, 0, 0.2, 1],
        },
      },
    };

    const desktopOptionPicker =
      optionPickerEnabled && !isMobile ? (
        <Sheet open={optionPickerOpen} onOpenChange={setOptionPickerOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md border-none p-0 bg-transparent"
          >
            <motion.div
              initial="closed"
              animate={optionPickerOpen ? "open" : "closed"}
              variants={desktopDrawerVariants}
              className="h-full bg-white flex flex-col rounded-l-[32px] shadow-[0_15px_60px_rgba(15,23,42,0.18)]"
            >
              <SheetHeader className="p-6 pb-4 text-left">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#9E9EA7] mb-1">
                  Quick add
                </p>
                <SheetTitle className="text-lg leading-tight text-[#0F172A]">
                  {item.name}
                </SheetTitle>
                <SheetDescription className="text-xs text-[#6B7280]">
                  Choose the option you want delivered
                </SheetDescription>
              </SheetHeader>
              <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-5">
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-[#F4F4F5] flex-shrink-0">
                    <Image
                      src={productImageSrc}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {effectiveOption?.name || availableOptions[0]?.name}
                    </p>
                    <p className="text-xs text-[#475467]">
                      {effectiveOption?.price
                        ? Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency: "NGN",
                          }).format(effectiveOption.price)
                        : ""}
                    </p>
                  </div>
                  <SheetClose
                    className="text-[#101828] text-xs font-semibold underline underline-offset-4"
                    asChild
                  >
                    <button type="button">Close</button>
                  </SheetClose>
                </div>
                {optionList}
              </div>
            </motion.div>
          </SheetContent>
        </Sheet>
      ) : null;

    const mobileOptionPicker =
      optionPickerEnabled && isMobile && isClient
        ? createPortal(
            <AnimatePresence>
              {optionPickerOpen && (
                <>
                  <motion.div
                    className="fixed inset-0 bg-black/40 z-[70]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setOptionPickerOpen(false)}
                  />
                  <motion.div
                    className="fixed inset-x-0 bottom-0 z-[75] rounded-t-[32px] bg-white px-5 pb-8 pt-5"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 240 }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(event, info) => {
                      if (info.offset.y > 100) {
                        setOptionPickerOpen(false);
                      }
                    }}
                  >
                    <div
                      className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300 cursor-grab active:cursor-grabbing"
                      onClick={() => setOptionPickerOpen(false)}
                    />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative h-12 w-12 rounded-2xl overflow-hidden bg-[#F4F4F5] flex-shrink-0">
                        <Image
                          src={productImageSrc}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-[#9E9EA7]">
                          Quick add
                        </p>
                        <p className="text-base font-semibold text-[#0F172A]">
                          {item.name}
                        </p>
                      </div>
                    </div>
                    {optionList}
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body
          )
        : null;

    const optionPicker = optionPickerEnabled
      ? isMobile
        ? mobileOptionPicker
        : desktopOptionPicker
      : null;

    if (minimal) {
      const minimalButtonClasses = clsx(
        "relative overflow-hidden font-semibold transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        item.iconOnly
          ? isMinimalDisabled
            ? "flex size-9 md:size-10 items-center justify-center rounded-full bg-gray-400 text-white cursor-not-allowed"
            : "flex size-9 md:size-10 items-center justify-center rounded-full bg-[#1B6013] text-white shadow-[0px_10px_24px_rgba(27,96,19,0.35)] hover:bg-[#1f7d1d] focus-visible:ring-[#F2C94C]"
          : isMinimalDisabled
            ? "rounded-full bg-gray-400 px-5 py-3 text-white cursor-not-allowed"
            : "rounded-full bg-gradient-to-r from-[#1B6013] to-[#1f7d1d] px-5 py-3 text-white shadow-[0px_15px_35px_rgba(27,96,19,0.35)] hover:shadow-[0px_18px_38px_rgba(27,96,19,0.45)]",
        className
      );

      const minimalQuantityControls = (
        <div className="flex items-center gap-2 rounded-full bg-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] border border-[#E4E7EC] px-3 py-1.5 text-sm">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleQuantityChange(quantity - 1, effectiveOption ?? null);
            }}
            className="p-1 rounded-full bg-[#F5F5F5] text-[#1B6013]"
            aria-label={quantity === 1 ? "Remove item" : "Decrease quantity"}
          >
            {quantity === 1 ? (
              <Trash2 className="size-[14px]" />
            ) : (
              <Minus className="size-[14px]" />
            )}
          </button>
          <span className="min-w-[20px] text-center font-semibold text-[#101828] text-sm">
            {quantity}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleQuantityChange(quantity + 1, effectiveOption ?? null);
            }}
            className="p-1 rounded-full bg-[#1B6013] text-white"
            aria-label="Increase quantity"
          >
            <Plus className="size-[14px]" />
          </button>
        </div>
      );

      return (
        <>
          {optionPicker}
          {showQuantityControls ? (
            <div className="flex w-full flex-col items-start gap-1.5">
              {minimalQuantityControls}
              {optionPickerEnabled && (
                <button
                  className="text-xs font-semibold text-[#1B6013] hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOptionPickerOpen(true);
                  }}
                >
                  + Add another option
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={(e) => {
                if (isOutOfSeason || isOutOfStock) return;
                handleAddToCartClick();
              }}
              className={minimalButtonClasses}
              disabled={
                isOutOfSeason || isOutOfStock || updateCartMutation.isPending
              }
              title={
                isOutOfSeason
                  ? "This product is out of season and cannot be purchased."
                  : isOutOfStock
                    ? "This product is out of stock."
                    : undefined
              }
              aria-label={
                item.iconOnly
                  ? isOutOfSeason || isOutOfStock
                    ? "Product unavailable"
                    : "Quick add to cart"
                  : "Add this item to your cart"
              }
            >
              {updateCartMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : item.iconOnly ? (
                <Plus className="w-4 h-4" />
              ) : (
                <span className="font-semibold tracking-wide">Add to Cart</span>
              )}
            </button>
          )}
        </>
      );
    }

    return (
      <>
        {optionPicker}
        <div className="space-y-4">
          {isInCart ? (
            <div className="flex flex-col gap-2">
              <p className="h6-bold">Quantity</p>
              <div className="flex items-center py-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuantityChange(quantity - 1, effectiveOption ?? null);
                  }}
                  disabled={updateCartMutation.isPending}
                  className="bg-[#F5F5F5] disabled:opacity-50 p-2 rounded-full"
                  aria-label={
                    quantity === 1 ? "Remove item" : "Decrease quantity"
                  }
                >
                  {quantity === 1 ? (
                    <Trash2 className="size-[14px]" />
                  ) : (
                    <Minus className="size-[14px]" />
                  )}
                </button>
                <span className="w-12 font-bold inline-block text-center">
                  {quantity}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuantityChange(quantity + 1, effectiveOption ?? null);
                  }}
                  disabled={
                    (item.countInStock !== null &&
                      item.countInStock !== undefined &&
                      quantity >= (item.countInStock || 100)) ||
                    updateCartMutation.isPending
                  }
                  className="p-1 rounded-full bg-[#1B6013]/70 backdrop-blur-sm shadow-md hover:bg-[#1B6013]/90 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
              <Link
                href="/checkout"
                className="text-white bg-[#1B6013] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] w-full flex justify-center items-center hover:bg-[#1a5f13cc] transition-colors"
              >
                Buy Now
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => {
                  if (isOutOfSeason) return;
                  handleAddToCartClick();
                }}
                disabled={isMinimalDisabled}
                className={clsx(
                  "text-[#1B6013] bg-[#F2C94C] rounded-[10px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] w-full font-semibold shadow-[0px_14px_32px_rgba(242,201,76,0.35)]",
                  "transition-colors duration-300",
                  missingOption && "animate-shake border border-red-500",
                  className,
                  isOutOfStock && "opacity-50 cursor-not-allowed",
                  isOutOfSeason && "opacity-50 cursor-not-allowed"
                )}
                title={
                  isOutOfSeason
                    ? "This product is out of season and cannot be purchased."
                    : undefined
                }
              >
                {isOutOfSeason ? (
                  "Out of Season"
                ) : updateCartMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                ) : isOutOfStock ? (
                  "Out of Stock"
                ) : (
                  "Add to Cart"
                )}
              </button>

              {missingOption && (
                <p className="text-red-500 text-xs mt-1">
                  Please select an option first
                </p>
              )}
              {isOutOfSeason && (
                <p className="text-red-500 text-xs mt-1">
                  This product is out of season and cannot be purchased.
                </p>
              )}
            </div>
          )}
        </div>
      </>
    );
  }
);

AddToCart.displayName = "AddToCart";

export default AddToCart;
