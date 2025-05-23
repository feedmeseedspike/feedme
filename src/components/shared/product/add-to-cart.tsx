"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  addItem,
  updateCartItem,
  removeItem,
} from "src/store/features/cartSlice";
import clsx from "clsx";
import Link from "next/link";
import { RootState } from "src/store";
import Image from "next/image";

interface ProductOption {
  name: string;
  price: number;
  image?: string;
  stockStatus?: string;
}

interface CartItem {
  clientId: string;
  product: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  countInStock?: number;
  options?: ProductOption[];
  selectedOption?: string;
  option?: {
    name: string;
    price: number;
    image?: string;
  };
}

interface AddToCartProps {
  item: CartItem;
  minimal?: boolean;
  className?: string;
  onAddToCart?: () => void;
  onError?: () => void;
  onOutOfStock?: () => void;
  iconOnly?: boolean;
}

const AddToCart = React.memo(
  ({
    item,
    minimal = false,
    className,
    onAddToCart,
    onError,
    onOutOfStock,
    iconOnly = false,
  }: AddToCartProps) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [missingOption, setMissingOption] = useState(false);

    const cartItems = useSelector((state: RootState) => state.cart.items);
    const selectedOption = useSelector((state: RootState) =>
      item.product ? state.options.selectedOptions[item.product] : undefined
    );

    // Reset quantity when product or option changes
    useEffect(() => {
      setQuantity(1);
    }, [item.product, selectedOption]);

    const handleIncrement = useCallback(() => {
      const maxQuantity = item.countInStock || 100;
      setQuantity((prev) => Math.min(prev + 1, maxQuantity));
    }, [item.countInStock]);

    const handleDecrement = useCallback(() => {
      setQuantity((prev) => Math.max(prev - 1, 1));
    }, []);

    const handleAddToCart = useCallback(() => {
      try {
        // Check stock availability
        if (item.countInStock === 0) {
          onOutOfStock?.();
          return;
        }

        // Validate option selection if options exist
        if (item.options?.length && !selectedOption) {
          setMissingOption(true);
          setTimeout(() => setMissingOption(false), 500);
          onError?.();
          return;
        }

        // Find selected option data
        const selectedOptionData = item.options?.find(
          (opt) => opt.name === selectedOption
        );

        // Find existing items in cart
        const existingItems = cartItems.filter(
          (cartItem) => cartItem.product === item.product
        );

        // Check for exact match (same product + same option)
        const exactMatch = existingItems.find(
          (cartItem) => cartItem.selectedOption === selectedOption
        );

        if (exactMatch) {
          // Update existing item
          const newQuantity = exactMatch.quantity + quantity;
          const maxQuantity = item.countInStock || 100;

          dispatch(
            updateCartItem({
              productId: item.product,
              selectedOption,
              quantity: Math.min(newQuantity, maxQuantity),
              option: selectedOptionData
                ? {
                    name: selectedOptionData.name,
                    price: selectedOptionData.price,
                    image: selectedOptionData.image,
                  }
                : undefined,
            })
          );
        } else if (existingItems.length > 0) {
          // Replace existing item with new option
          const firstExisting = existingItems[0];
          dispatch(
            removeItem({
              productId: firstExisting.product,
              selectedOption: firstExisting.selectedOption,
            })
          );

          // Add new item with selected option
          dispatch(
            addItem({
              item: {
                ...item,
                price: selectedOptionData?.price ?? item.price,
                quantity: Math.min(quantity, item.countInStock || 100),
                selectedOption: selectedOption ?? undefined,
                option: selectedOptionData
                  ? {
                      name: selectedOptionData.name,
                      price: selectedOptionData.price,
                      image: selectedOptionData.image,
                    }
                  : undefined,
              },
              quantity: Math.min(quantity, item.countInStock || 100),
            })
          );
        } else {
          // Add new item to cart
          dispatch(
            addItem({
              item: {
                ...item,
                price: selectedOptionData?.price ?? item.price,
                quantity: Math.min(quantity, item.countInStock || 100),
                selectedOption: selectedOption ?? undefined,
                option: selectedOptionData
                  ? {
                      name: selectedOptionData.name,
                      price: selectedOptionData.price,
                      image: selectedOptionData.image,
                    }
                  : undefined,
              },
              quantity: Math.min(quantity, item.countInStock || 100),
            })
          );
        }

        onAddToCart?.();

        // Redirect to cart if not minimal version
        if (!minimal) {
          router.push("/cart");
        }
      } catch (error) {
        console.error("Failed to add item to cart:", error);
        onError?.();
      }
    }, [
      item,
      quantity,
      selectedOption,
      cartItems,
      dispatch,
      onAddToCart,
      onError,
      onOutOfStock,
      minimal,
      router,
    ]);

    // Minimal version (for product cards)
    if (minimal) {
      return (
        <button
          onClick={(e) => {
            e.preventDefault();
            handleAddToCart();
          }}
          className={clsx(
            "relative overflow-hidden rounded-[6px] bg-[#1B6013] px-3 sm:px-[20px] py-3 text-sm lg:text-[16px] w-full text-white",
            "transition-all duration-300 ease-in-out",
            "hover:bg-[#1a5f13cc] hover:shadow-md",
            className,
            item.countInStock === 0 && "opacity-50 cursor-not-allowed"
          )}
          disabled={item.countInStock === 0}
        >
          <span className="font-semibold">
            {item.countInStock === 0 ? "Out of Stock" : "Add to Cart"}
          </span>
        </button>
      );
    }

    // Full version (for product pages)
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <p className="h6-bold">Quantity</p>
          <div className="flex items-center py-3">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="bg-[#F5F5F5] disabled:opacity-50 p-2 rounded-full"
            >
              <AiOutlineMinus className="w-3 h-3" />
            </button>
            <span className="w-12 font-bold inline-block text-center">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= (item.countInStock || 100)}
              className="bg-[#F5F5F5] disabled:opacity-50 p-2 rounded-full"
            >
              <AiOutlinePlus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/checkout"
            className="text-white bg-[#1B6013] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] w-full flex justify-center items-center hover:bg-[#1a5f13cc] transition-colors"
          >
            Buy Now
          </Link>

          <button
            onClick={handleAddToCart}
            disabled={item.countInStock === 0}
            className={clsx(
              "text-[#284625] bg-[#F2F8F1] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] w-full",
              "transition-colors duration-300",
              missingOption && "animate-shake border border-red-500",
              className,
              item.countInStock === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#e0f0de]"
            )}
          >
            {item.countInStock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>

          {missingOption && (
            <p className="text-red-500 text-xs mt-1">
              Please select an option first
            </p>
          )}
        </div>
      </div>
    );
  }
);

AddToCart.displayName = "AddToCart"; // For React DevTools

export default AddToCart;
