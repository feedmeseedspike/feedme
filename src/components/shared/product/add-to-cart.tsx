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
import { CartItem, ProductOption } from "src/lib/actions/cart.actions";
import { ItemToUpdateMutation } from "src/queries/cart";
import { Trash2, Minus, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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
    onOutOfStock?: () => void;
    iconOnly?: boolean;
    bundleId?: string;
    in_season?: boolean | null; // <-- add this
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

    const { data: cartItems } = useCartQuery();
    const user = useUser();
    const anonymousCart = useAnonymousCart();

    const updateCartMutation = useUpdateCartMutation();
    const removeCartItemMutation = useRemoveFromCartMutation();
    const queryClient = useQueryClient();

    const selectedOptionNameForAction =
      item.selectedOption === "" ? null : item.selectedOption;

    useEffect(() => {
      setQuantity(item.countInStock || 1);
    }, [item.countInStock]);

    const handleQuantityChange = useCallback(
      async (newQuantity: number) => {
        if (!user) {
          // Handle anonymous cart
          if (newQuantity === 0) {
            const existingAnonymousItem = anonymousCart.items.find(
              (cartItem) =>
                cartItem.product_id === item.id &&
                JSON.stringify(cartItem.option || null) ===
                JSON.stringify(item.option || null)
            );
            if (existingAnonymousItem) {
              anonymousCart.removeItem(existingAnonymousItem.id);
              showToast(
                `${item.name}${item.option?.name ? ` (${item.option.name})` : ""} removed from cart`,
                "info"
              );
            }
          } else {
            const existingAnonymousItem = anonymousCart.items.find(
              (cartItem) =>
                cartItem.product_id === item.id &&
                JSON.stringify(cartItem.option || null) ===
                JSON.stringify(item.option || null)
            );
            if (existingAnonymousItem) {
              anonymousCart.updateQuantity(existingAnonymousItem.id, newQuantity);
            } else {
              anonymousCart.addItem(
                item.bundleId ? null : item.id,
                newQuantity,
                item.price,
                item.option,
                item.bundleId ? item.id : null,
                null
              );
            }
            setQuantity(newQuantity);
            setShowQuantityControls(true);
            // Trigger cart update event
            window.dispatchEvent(new Event('anonymousCartUpdated'));
          }
          return;
        }
        if (newQuantity < 0) return;
        const currentCartItems = Array.isArray(cartItems) ? cartItems : [];
        const existingItemInCart = currentCartItems.find(
          (cartItem) =>
            cartItem.product_id === item.id &&
            JSON.stringify(cartItem.option || null) ===
            JSON.stringify(item.option || null)
        );
        if (newQuantity === 0) {
          if (existingItemInCart?.id) {
            try {
              await removeCartItemMutation.mutateAsync(existingItemInCart.id);
              showToast(
                `${item.name}${item.option?.name ? ` (${item.option.name})` : ""} removed from cart`,
                "info"
              );
            } catch (error: any) {
              console.error("Failed to remove item:", error);
              if (error.message?.includes("You must be logged in")) {
                onAuthRequired?.();
              } else {
                showToast(
                  error.message || "Failed to remove item from cart.",
                  "error"
                );
              }
            }
          }
        } else {
          setQuantity(newQuantity);
          setShowQuantityControls(true);
          try {
            const itemsForMutation: ItemToUpdateMutation[] = currentCartItems
              .map((cartItem) => ({
                product_id: cartItem.product_id || null,
                bundle_id: cartItem.bundle_id || null,
                option:
                  cartItem.option && typeof cartItem.option === "object"
                    ? JSON.parse(JSON.stringify(cartItem.option))
                    : null,
                quantity:
                  (cartItem.product_id &&
                    cartItem.product_id === item.id &&
                    JSON.stringify(cartItem.option || null) ===
                    JSON.stringify(item.option || null)) ||
                    (cartItem.bundle_id && cartItem.bundle_id === item.id)
                    ? newQuantity
                    : cartItem.quantity,
                price:
                  cartItem.option &&
                    typeof cartItem.option === "object" &&
                    "price" in cartItem.option
                    ? ((cartItem.option as any).price ?? cartItem.price ?? 0)
                    : (cartItem.price ?? 0),
              }))
              .filter((item) => item.quantity > 0);
            const targetItemExists = itemsForMutation.some(
              (cartItem) =>
                (cartItem.product_id &&
                  cartItem.product_id === item.id &&
                  JSON.stringify(cartItem.option || null) ===
                  JSON.stringify(item.option || null)) ||
                (cartItem.bundle_id && cartItem.bundle_id === item.id)
            );
            if (!targetItemExists) {
              itemsForMutation.push({
                product_id: item.bundleId ? null : item.id,
                bundle_id: item.bundleId ? item.id : null,
                option:
                  item.option && typeof item.option === "object"
                    ? JSON.parse(JSON.stringify(item.option))
                    : null,
                quantity: newQuantity,
                price: item.price,
              });
            }
            await updateCartMutation.mutateAsync(itemsForMutation);
            // Invalidate cart query for authenticated users
            queryClient.invalidateQueries({ queryKey: cartQueryKey });
            onAddToCart?.();
          } catch (error: any) {
            console.error("Failed to update cart:", error);
            if (error.message?.includes("You must be logged in")) {
              onAuthRequired?.();
            } else {
              showToast(error.message || "Failed to update cart.", "error");
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
        item.id,
        item.option,
        item.name,
        item.bundleId,
        item.price,
        removeCartItemMutation,
        updateCartMutation,
        onAddToCart,
        onError,
      ]
    );

    const handleIncrement = useCallback(() => {
      const maxQuantity = item.countInStock || 100;
      handleQuantityChange(Math.min(quantity + 1, maxQuantity));
    }, [item.countInStock, handleQuantityChange, quantity]);

    const handleDecrement = useCallback(() => {
      handleQuantityChange(quantity - 1);
    }, [handleQuantityChange, quantity]);

    const handleAddToCartClick = useCallback(async () => {
      if (!user) {
        // Handle anonymous cart
        try {
          if (
            item.countInStock !== null &&
            item.countInStock !== undefined &&
            item.countInStock <= 0
          ) {
            return;
          }
          if (
            item.options &&
            item.options.length > 0 &&
            (item.selectedOption === undefined ||
              item.selectedOption === null ||
              item.selectedOption === "")
          ) {
            setMissingOption(true);
            setTimeout(() => setMissingOption(false), 500);
            onError?.();
            return;
          }

          anonymousCart.addItem(
            item.bundleId ? null : item.id,
            1,
            item.price,
            item.option,
            item.bundleId ? item.id : null,
            null
          );

          setShowQuantityControls(true);
          setQuantity(1);
          showToast(
            `${item.name}${item.option?.name ? ` (${item.option.name})` : ""} added to cart!`,
            "success"
          );
          // Trigger cart update event
          window.dispatchEvent(new Event('anonymousCartUpdated'));
          onAddToCart?.();
        } catch (error: any) {
          console.error("Failed to add to anonymous cart:", error);
          showToast("Failed to add to cart.", "error");
          onError?.();
        }
        return;
      }
      try {
        if (
          item.countInStock !== null &&
          item.countInStock !== undefined &&
          item.countInStock <= 0
        ) {
          return;
        }
        if (
          item.options &&
          item.options.length > 0 &&
          (item.selectedOption === undefined ||
            item.selectedOption === null ||
            item.selectedOption === "")
        ) {
          setMissingOption(true);
          setTimeout(() => setMissingOption(false), 500);
          onError?.();
          return;
        }
        const currentCartItems = Array.isArray(cartItems) ? cartItems : [];
        const itemsForMutation: ItemToUpdateMutation[] = currentCartItems
          .map((cartItem) => ({
            product_id: cartItem.product_id || null,
            bundle_id: cartItem.bundle_id || null,
            offer_id: cartItem.offer_id || null,
            option:
              cartItem.option && typeof cartItem.option === "object"
                ? JSON.parse(JSON.stringify(cartItem.option))
                : null,
            quantity: cartItem.quantity,
            price:
              cartItem.option &&
                typeof cartItem.option === "object" &&
                "price" in cartItem.option
                ? ((cartItem.option as any).price ?? cartItem.price ?? 0)
                : (cartItem.price ?? 0),
          }))
          .filter((item) => item.quantity > 0);
        const targetItemExists = itemsForMutation.some(
          (cartItem) =>
            (cartItem.product_id &&
              cartItem.product_id === item.id &&
              JSON.stringify(cartItem.option || null) ===
              JSON.stringify(item.option || null)) ||
            (cartItem.bundle_id && cartItem.bundle_id === item.id)
        );
        if (!targetItemExists) {
          itemsForMutation.push({
            product_id: item.bundleId ? null : item.id,
            bundle_id: item.bundleId ? item.id : null,
            offer_id: null,
            option:
              item.option && typeof item.option === "object"
                ? JSON.parse(JSON.stringify(item.option))
                : null,
            quantity: 1,
            price: item.price,
          });
        }

        await updateCartMutation.mutateAsync(itemsForMutation);
        setShowQuantityControls(true);
        setQuantity(1);
        showToast(
          `${item.name}${item.option?.name ? ` (${item.option.name})` : ""} added to cart!`,
          "success"
        );
        // Invalidate and refetch cart query for authenticated users  
        await queryClient.invalidateQueries({ queryKey: cartQueryKey });
        await queryClient.refetchQueries({ queryKey: cartQueryKey });
        onAddToCart?.();
      } catch (error: any) {
        console.error("Failed to add to cart:", error);
        if (error.message?.includes("You must be logged in")) {
          onAuthRequired?.();
        } else {
          showToast(error.message || "Failed to add to cart.", "error");
          onError?.();
        }
      }
    }, [
      user,
      anonymousCart,
      onAuthRequired,
      item.countInStock,
      item.options,
      item.selectedOption,
      item.name,
      item.option,
      item.id,
      item.bundleId,
      item.price,
      cartItems,
      updateCartMutation,
      onAddToCart,
      onError,
    ]);

    const isInCart = useMemo(() => {
      if (user) {
        return (cartItems || []).some(
          (cartItem) =>
            cartItem.product_id === item.id &&
            JSON.stringify(cartItem.option || null) ===
            JSON.stringify(item.option || null)
        );
      } else {
        return anonymousCart.items.some(
          (cartItem) =>
            cartItem.product_id === item.id &&
            JSON.stringify(cartItem.option || null) ===
            JSON.stringify(item.option || null)
        );
      }
    }, [cartItems, anonymousCart.items, item.id, item.option, user]);

    useEffect(() => {
      setShowQuantityControls(isInCart);
      if (!isInCart) {
        setQuantity(1);
      }
    }, [isInCart]);

    useEffect(() => {
      if (user) {
        const currentItemInCart = (cartItems || []).find(
          (cartItem) =>
            cartItem.product_id === item.id &&
            JSON.stringify(cartItem.option || null) ===
            JSON.stringify(item.option || null)
        );
        if (currentItemInCart) {
          setQuantity(currentItemInCart.quantity);
        } else if (!isInCart) {
          setQuantity(1);
        }
      } else {
        const currentAnonymousItem = anonymousCart.items.find(
          (cartItem) =>
            cartItem.product_id === item.id &&
            JSON.stringify(cartItem.option || null) ===
            JSON.stringify(item.option || null)
        );
        if (currentAnonymousItem) {
          setQuantity(currentAnonymousItem.quantity);
        } else if (!isInCart) {
          setQuantity(1);
        }
      }
    }, [cartItems, anonymousCart.items, item.id, item.option, isInCart, user]);

    const isOutOfSeason = item.in_season === false;

    // Check if cart data is loading
    const cartQuery = useCartQuery();
    if (user && cartQuery.isLoading) {
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

    if (minimal) {
      return (
        <button
          onClick={(e) => {
            if (isOutOfSeason) return;
            handleAddToCartClick();
          }}
          className={clsx(
            "relative overflow-hidden rounded-[6px] bg-[#1B6013] px-3 sm:px-[20px] py-3 text-sm lg:text-[16px] w-full text-white",
            "transition-all duration-300 ease-in-out",
            "hover:bg-[#1a5f13cc] hover:shadow-md",
            className,
            item.countInStock !== null &&
            item.countInStock !== undefined &&
            item.countInStock <= 0 &&
            "opacity-50 cursor-not-allowed",
            isOutOfSeason && "opacity-50 cursor-not-allowed"
          )}
          disabled={
            isOutOfSeason ||
            (item.countInStock !== null &&
              item.countInStock !== undefined &&
              item.countInStock <= 0) ||
            updateCartMutation.isPending
          }
          title={
            isOutOfSeason
              ? "This product is out of season and cannot be purchased."
              : undefined
          }
        >
          <span className="font-semibold">
            {isOutOfSeason ? (
              "Out of Season"
            ) : updateCartMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
            ) : item.countInStock !== null &&
              item.countInStock !== undefined &&
              item.countInStock <= 0 ? (
              "Out of Stock"
            ) : (
              "Add to Cart"
            )}
          </span>
        </button>
      );
    }

    return (
      <div className="space-y-4">
        {isInCart ? (
          <div className="flex flex-col gap-2">
            <p className="h6-bold">Quantity</p>
            <div className="flex items-center py-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuantityChange(quantity - 1);
                }}
                disabled={quantity <= 1 || updateCartMutation.isPending}
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
                  handleQuantityChange(quantity + 1);
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
              disabled={
                isOutOfSeason ||
                (item.countInStock !== null &&
                  item.countInStock !== undefined &&
                  item.countInStock <= 0) ||
                updateCartMutation.isPending
              }
              className={clsx(
                "text-[#284625] bg-[#F2F8F1] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] w-full",
                "transition-colors duration-300",
                missingOption && "animate-shake border border-red-500",
                className,
                item.countInStock !== null &&
                item.countInStock !== undefined &&
                item.countInStock <= 0 &&
                "opacity-50 cursor-not-allowed",
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
              ) : item.countInStock !== null &&
                item.countInStock !== undefined &&
                item.countInStock <= 0 ? (
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
    );
  }
);

AddToCart.displayName = "AddToCart";

export default AddToCart;
