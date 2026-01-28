"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@components/ui/card";
import Rating from "./rating";
import { generateId, formatNaira } from "../../../lib/utils";
import ImageHover from "./image-hover";
import { IProductInput } from "src/types";
import ProductPrice from "@components/shared/product/product-price";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { setSelectedOption } from "src/store/features/optionsSlice";
import { RootState } from "src/store";
import { useToast } from "src/hooks/useToast";
import { Heart, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@utils/supabase/client";
import { debounce } from "lodash";
import { cn } from "src/lib/utils";
import { useUser } from "src/hooks/useUser";
import { useRouter } from "next/navigation";
import { useAnonymousCart } from "src/hooks/useAnonymousCart";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@components/ui/sheet";
import { createPortal } from "react-dom";
import { useMediaQuery } from "usehooks-ts";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} from "src/queries/favorites";
import {
  useCartQuery,
  useUpdateCartMutation,
  useRemoveFromCartMutation,
  ItemToUpdateMutation,
  cartQueryKey,
} from "src/queries/cart";
import { CartItem, ProductOption } from "src/lib/actions/cart.actions";
// import { Json } from "../../../utils/database.types";

interface ProductDetailsCardProps {
  product: IProductInput;
  hideDetails?: boolean;
  hideBorder?: boolean;
  hideAddToCart?: boolean;
  tag?: string;
}

const ProductDetailsCard: React.FC<ProductDetailsCardProps> = React.memo(
  ({
    product,
    hideBorder = false,
    hideDetails = false,
    hideAddToCart = false,
  }) => {
    const dispatch = useDispatch();
    const { showToast } = useToast();
    const { user } = useUser();
    const router = useRouter();
    const anonymousCart = useAnonymousCart();

    // Tanstack Query for Cart
    const { data: cartItems, isLoading: isLoadingCart } = useCartQuery();

    // Tanstack Query for Favorites
    const { data: favorites, isLoading: isLoadingFavorites } =
      useQuery(getFavoritesQuery());
    const productId = product.id || (product as any)._id;
    const isFavorited =
      productId && favorites ? favorites.includes(productId) : false;

    // Use mutations for adding/removing favorites
    const addFavoriteMutation = useAddFavoriteMutation();
    const removeFavoriteMutation = useRemoveFavoriteMutation();

    // Combined loading state
    const isLoading =
      isLoadingFavorites ||
      (user && isLoadingCart) || // Only check cart loading for authenticated users
      addFavoriteMutation.isPending ||
      removeFavoriteMutation.isPending;

    // Get selected option from Redux
    const selectedOption = useSelector((state: RootState) =>
      product.id ? state.options.selectedOptions[product.id] : undefined
    );

    // Extract and sort product options
    const sortedOptions = useMemo(() => {
      // Handle both old array format and new object format for options
      let opts = [];
      if (Array.isArray(product.options)) {
        // Old format: options is array of variations
        opts = product.options.filter(Boolean);
      } else if (product.options && typeof product.options === "object") {
        // New format: options is object with variations and customizations
        opts = (product.options as any).variations || [];
      }

      if (opts.length === 0) return [];
      return [...opts].sort((a, b) => a.price - b.price);
    }, [product.options]);

    // Get data for the selected option with validation
    const selectedOptionData = useMemo(() => {
      if (sortedOptions.length === 0) return null;

      if (!selectedOption) {
        return sortedOptions[0];
      }

      const option = sortedOptions.find((opt) => opt.name === selectedOption);
      return option || sortedOptions[0];
    }, [selectedOption, sortedOptions]);

    // Define selectedOptionLabel early so it can be used in callbacks
    const selectedOptionLabel = useMemo(
      () =>
        `${product.name}${
          selectedOptionData?.name ? ` (${selectedOptionData.name})` : ""
        }`,
      [product.name, selectedOptionData?.name]
    );

    // Find the item in the cart (authenticated or anonymous)
    const currentCartItem = useMemo(() => {
      if (user) {
        if (!cartItems) return undefined;
        return cartItems.find((item) => {
          return (
            item.product_id === product.id &&
            JSON.stringify(item.option || null) ===
              JSON.stringify(selectedOptionData || null)
          );
        });
      } else {
        // For anonymous users, find item in anonymous cart
        return anonymousCart.items.find((item) => {
          return (
            item.product_id === product.id &&
            JSON.stringify(item.option || null) ===
              JSON.stringify(selectedOptionData || null)
          );
        });
      }
    }, [user, cartItems, anonymousCart.items, product.id, selectedOptionData]);

    const [quantity, setQuantity] = useState(currentCartItem?.quantity ?? 1);
    const [showQuantityControls, setShowQuantityControls] = useState(
      Boolean(currentCartItem)
    );

    // Use cart mutations
    const updateCartMutation = useUpdateCartMutation();
    const removeCartItemMutation = useRemoveFromCartMutation();

    // Update local state when the item in the cart changes
    // Only sync from cart if mutation is not pending to avoid race conditions
    useEffect(() => {
      if (updateCartMutation.isPending) return;
      
      setQuantity(currentCartItem?.quantity ?? 1);
      setShowQuantityControls(Boolean(currentCartItem));
    }, [currentCartItem, updateCartMutation.isPending]);

    // Handler to update quantity via mutation
    const handleUpdateCartQuantity = useCallback(
      async (newQuantity: number) => {
        if (!product.id) return;

        if (!user) {
          const existingAnonymousItem = anonymousCart.items.find(
            (item) =>
              item.product_id === product.id &&
              JSON.stringify(item.option || null) ===
                JSON.stringify(selectedOptionData || null)
          );

          if (newQuantity === 0) {
            if (existingAnonymousItem) {
              anonymousCart.removeItem(existingAnonymousItem.id);
              showToast(`${selectedOptionLabel} removed from cart`, "info");
            }
          } else {
            if (existingAnonymousItem) {
              anonymousCart.updateQuantity(
                existingAnonymousItem.id,
                newQuantity
              );
            } else {
              anonymousCart.addItem(
                product.bundleId ? null : product.id,
                newQuantity,
                selectedOptionData?.price ?? product.price ?? 0,
                selectedOptionData as any,
                product.bundleId ? product.id : null,
                null,
                {
                  name: product.name,
                  slug: product.slug,
                  image: Array.isArray(product.images)
                    ? typeof product.images[0] === "string"
                      ? product.images[0]
                      : undefined
                    : undefined,
                },
                null
              );
            }
            showToast(
              `${selectedOptionLabel} ${
                newQuantity === 1 ? "added to" : "updated in"
              } cart`,
              "success",
              undefined,
              {
                imageUrl: Array.isArray(product.images)
                  ? typeof product.images[0] === "string"
                    ? product.images[0]
                    : undefined
                  : undefined,
                title: newQuantity === 1 ? "Added to Cart" : "Cart Updated",
              }
            );
          }
          return;
        }

        const currentItems = cartItems || [];

        const itemsForMutation: ItemToUpdateMutation[] = currentItems
          .map((item: CartItem) => {
            const isTargetItem =
              item.product_id === product.id &&
              JSON.stringify(item.option || null) ===
                JSON.stringify(selectedOptionData || null);

            return {
              product_id: item.product_id || null,
              bundle_id: item.bundle_id || null,
              offer_id: item.offer_id || null,
              black_friday_item_id:
                (item as any).black_friday_item_id || null,
              option: item.option,
              quantity: isTargetItem ? newQuantity : item.quantity,
              price:
                (item.option as ProductOption | null)?.price ??
                item.price ??
                product.price ??
                0,
            };
          })
          .filter((item) => item.quantity > 0);

        const targetItemExistsInMutationArray = itemsForMutation.some(
          (item) =>
            item.product_id === product.id &&
            JSON.stringify(item.option || null) ===
              JSON.stringify(selectedOptionData || null)
        );

        const itemPriceForNew = selectedOptionData?.price ?? product.price ?? 0;

        if (newQuantity > 0 && !targetItemExistsInMutationArray) {
          itemsForMutation.push({
            product_id: product.bundleId ? null : product.id,
            bundle_id: product.bundleId ? product.id : null,
            offer_id: null,
            black_friday_item_id: null,
            option: selectedOptionData
              ? JSON.parse(JSON.stringify(selectedOptionData))
              : null,
            quantity: newQuantity,
            price: itemPriceForNew,
          });
        }

        try {
          // Optimistically update UI first for instant feedback
          setQuantity(newQuantity);
          setShowQuantityControls(newQuantity > 0);

          const result = await updateCartMutation.mutateAsync(itemsForMutation);
          // Check if mutation actually succeeded
          if (!result.success) {
            throw new Error(result.error || "Failed to update cart");
          }
        } catch (error: any) {
          console.error("Failed to update cart item quantity:", error);
          // Revert optimistic update on error
          const currentItemInCart = (cartItems || []).find(
            (item) =>
              item.product_id === product.id &&
              JSON.stringify(item.option || null) ===
                JSON.stringify(selectedOptionData || null)
          );
          if (currentItemInCart) {
            setQuantity(currentItemInCart.quantity);
          } else {
            setQuantity(1);
            setShowQuantityControls(false);
          }
          showToast(
            `Couldn't update ${selectedOptionLabel} in your cart.`,
            "error"
          );
        }
      },
      [
        product.id,
        product.name,
        product.price,
        product.bundleId,
        user,
        cartItems,
        anonymousCart,
        selectedOptionData,
        selectedOptionLabel,
        showToast,
        router,
        updateCartMutation,
      ]
    );

    // Handler to remove item via mutation
    const handleRemoveFromCart = useCallback(async () => {
      if (!currentCartItem?.id) return;

      if (!user) {
        // Handle anonymous cart removal
        anonymousCart.removeItem(currentCartItem.id);
        setShowQuantityControls(false);
        setQuantity(1);
        showToast(`${selectedOptionLabel} removed from cart`, "info");
        return;
      }

      try {
        await removeCartItemMutation.mutateAsync(currentCartItem.id);
        setShowQuantityControls(false);
        setQuantity(1);
      } catch (error: any) {
        console.error("Failed to remove cart item:", error);
        showToast(
          `Couldn't remove ${selectedOptionLabel} from your cart.`,
          "error"
        );
      }
    }, [
      currentCartItem,
      user,
      anonymousCart,
      selectedOptionLabel,
      showToast,
      router,
      removeCartItemMutation,
    ]);

    const handleOptionChange = useCallback(
      (value: string) => {
        if (product.id) {
          dispatch(
            setSelectedOption({
              productId: product.id,
              option: value,
            })
          );
        }
      },
      [dispatch, product.id]
    );

    const handleAddToCartClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if product is out of season
      if (product.in_season === false) {
        showToast(
          `${selectedOptionLabel} is currently out of season and can't be added to cart.`,
          "error"
        );
        return;
      }

      // Immediately show quantity controls for instant UI feedback
      setShowQuantityControls(true);
      setQuantity(1);

      // Update cart (works for both authenticated and anonymous users)
      handleUpdateCartQuantity(1);
    };

    const handleQuantityChange = useCallback(
      (newQuantity: number) => {
        // Check if product is out of season and user is trying to increase quantity
        if (
          product.in_season === false &&
          newQuantity > (currentCartItem?.quantity ?? 0)
        ) {
          showToast(
            `${selectedOptionLabel} can't be increased because it's out of season.`,
            "error"
          );
          return;
        }

        if (newQuantity < 1) {
          handleRemoveFromCart();
        } else {
          handleUpdateCartQuantity(newQuantity);
        }
      },
      [
        showToast,
        handleRemoveFromCart,
        handleUpdateCartQuantity,
        product.in_season,
        currentCartItem?.quantity,
        selectedOptionLabel,
      ]
    );

    // Handle favorite toggle
    const handleToggleLike = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const productId = product.id || (product as any)._id;
        
        if (!productId) {
          console.error("No product ID found for favorite toggle", product);
          return;
        }

        if (!user) {
          showToast("Please log in to add favorites", "error");
          router.push(
            `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
          );
          return;
        }

        try {
          if (isFavorited) {
            await removeFavoriteMutation.mutateAsync(productId);
            showToast(`${product.name} removed from favorites`, "info");
          } else {
            await addFavoriteMutation.mutateAsync(productId);
            showToast(`${product.name} added to favorites`, "success");
          }
        } catch (error: any) {
          console.error("Failed to update favorites:", error);
          if (error.message?.includes("You must be logged in")) {
            showToast("Please log in to modify favorites", "error");
            router.push(
              `/login?callbackUrl=${encodeURIComponent(
                window.location.pathname
              )}`
            );
          } else {
            showToast(error.message || "Failed to update favorites", "error");
          }
        }
      },
      [
        product.id,
        (product as any)._id,
        product.name,
        user,
        showToast,
        router,
        isFavorited,
        removeFavoriteMutation,
        addFavoriteMutation,
      ]
    );

    const ProductImage = useMemo(() => {
      const discountPercent = Math.round(
        100 - (product.price / (product.list_price || product.price)) * 100
      );

      const currentOption =
        selectedOptionData ||
        (sortedOptions.length > 0 ? sortedOptions[0] : null);

      return (
        <div className="relative">
          {/* Like button with animation */}
          <motion.button
            onClick={handleToggleLike}
            disabled={isLoading}
            className={cn(
              "absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-gray-100 transition-colors shadow-md",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            aria-label={
              isFavorited ? "Remove from favorites" : "Add to favorites"
            }
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            ) : (
              <motion.div
                animate={{
                  scale: isFavorited ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isFavorited ? "fill-red-600 text-red-600" : "text-gray-700"
                  )}
                />
              </motion.div>
            )}
          </motion.button>

          {/* Add to cart button */}
          <div className="absolute bottom-2 right-2 z-10">
            <AnimatePresence mode="wait">
              {showQuantityControls ? (
                <motion.div
                  key="quantity-controls"
                  initial={{
                    width: 40,
                    opacity: 0,
                    scale: 0.8,
                    x: 20,
                  }}
                  animate={{
                    width: "auto",
                    opacity: 1,
                    scale: 1,
                    x: 0,
                  }}
                  exit={{
                    width: 40,
                    opacity: 0,
                    scale: 0.8,
                    x: 20,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    duration: 0.3,
                  }}
                  className="flex items-center gap-2 bg-white rounded-full shadow-md p-1 border border-gray-100 overflow-hidden"
                >
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05, type: "spring", stiffness: 400 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (quantity === 1) {
                        setShowQuantityControls(false);
                        setQuantity(1);
                        handleRemoveFromCart();
                      } else {
                        handleQuantityChange(quantity - 1);
                      }
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors text-[#1B6013]"
                    aria-label={
                      quantity === 1 ? "Remove item" : "Decrease quantity"
                    }
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <motion.div
                      animate={{ rotate: quantity === 1 ? [0, 10, -10, 0] : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {quantity === 1 ? (
                        <Trash2 className="size-[14px]" />
                      ) : (
                        <Minus className="size-[14px]" />
                      )}
                    </motion.div>
                  </motion.button>

                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                    className="text-sm font-medium w-4 text-center"
                    key={quantity}
                  >
                    <motion.span
                      initial={{ scale: 1.3, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                    >
                      {quantity}
                    </motion.span>
                  </motion.span>

                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      // Check if product is out of season
                      if (product.in_season === false) {
                        showToast(
                          `${selectedOptionLabel} can't be increased because it's out of season.`,
                          "error"
                        );
                        return;
                      }

                      const newQuantity = quantity + 1;
                      handleQuantityChange(newQuantity);
                    }}
                    disabled={product.in_season === false}
                    className={cn(
                      "p-1 rounded-full backdrop-blur-sm shadow-md transition-colors",
                      product.in_season === false
                        ? "bg-gray-300 cursor-not-allowed opacity-50"
                        : "bg-[#1B6013]/70 hover:bg-[#1B6013]/90"
                    )}
                    aria-label="Increase quantity"
                    whileHover={{
                      scale: product.in_season !== false ? 1.1 : 1,
                    }}
                    whileTap={{ scale: product.in_season !== false ? 0.9 : 1 }}
                  >
                    <motion.div
                      animate={{
                        rotate: product.in_season !== false ? [0, 90, 0] : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </motion.div>
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="add-to-cart"
                  initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.3,
                    rotate: 180,
                    x: -60,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    duration: 0.4,
                  }}
                  onClick={handleAddToCartClick}
                  disabled={product.in_season === false}
                  className={cn(
                    "p-2 rounded-full backdrop-blur-sm shadow-md transition-all duration-300 relative overflow-hidden",
                    product.in_season === false
                      ? "bg-gray-300 cursor-not-allowed opacity-50"
                      : "bg-[#1B6013]/90 hover:bg-[#1B6013] hover:shadow-lg"
                  )}
                  aria-label={
                    product.in_season === false
                      ? "Product out of season"
                      : "Add to cart"
                  }
                  whileHover={{
                    scale: product.in_season !== false ? 1.1 : 1,
                    boxShadow:
                      product.in_season !== false
                        ? "0 8px 25px rgba(27, 96, 19, 0.3)"
                        : undefined,
                  }}
                  whileTap={{
                    scale: product.in_season !== false ? 0.95 : 1,
                  }}
                >
                  <motion.div
                    animate={{
                      rotate: product.in_season !== false ? [0, 180, 360] : 0,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />

                  <motion.div
                    whileHover={{
                      rotate: product.in_season !== false ? [0, 90, 0] : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Plus className="w-4 h-4 text-white relative z-10" />
                  </motion.div>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Product image */}
          <Link href={`/product/${product.slug}`} passHref>
            <div
              className={cn(
                "relative h-[10rem] lg:h-[12rem] w-full overflow-hidden rounded-lg"
              )}
            >
              {product.images && product.images.length > 1 ? (
                <ImageHover
                  src={
                    typeof product.images[0] === "string"
                      ? product.images[0]
                      : typeof product.images[0] === "object" &&
                          product.images[0] !== null &&
                          "url" in product.images[0]
                        ? (product.images[0] as { url: string }).url
                        : "/placeholder-product.png"
                  }
                  hoverSrc={
                    typeof product.images[1] === "string"
                      ? product.images[1]
                      : typeof product.images[1] === "object" &&
                          product.images[1] !== null &&
                          "url" in product.images[1]
                        ? (product.images[1] as { url: string }).url
                        : "/placeholder-product.png"
                  }
                  alt={product.name}
                />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={
                      product.images?.[0]
                        ? typeof product.images[0] === "string"
                          ? product.images[0]
                          : typeof product.images[0] === "object" &&
                              product.images[0] !== null &&
                              "url" in product.images[0]
                            ? (product.images[0] as { url: string }).url
                            : "/placeholder-product.png"
                        : "/placeholder-product.png"
                    }
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 ease-in-out hover:scale-105  h-full w-full"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-product.png";
                    }}
                  />
                </div>
              )}

              {/* {discountPercent > 0 && (
                <span className="absolute top-2 left-2 bg-[#1B6013] text-white text-xs font-semibold px-2 py-1 rounded-md z-10">
                  -{discountPercent}%
                </span>
              )} */}
            </div>
          </Link>
        </div>
      );
    }, [
      product.price,
      product.list_price,
      product.in_season,
      product.slug,
      product.images,
      product.name,
      selectedOptionData,
      sortedOptions,
      handleToggleLike,
      isLoading,
      isFavorited,
      showQuantityControls,
      quantity,
      handleRemoveFromCart,
      handleQuantityChange,
      showToast,
      handleUpdateCartQuantity,
    ]);

    const ProductDetails = useMemo(() => {
      // Safely determine the price display
      let priceDisplay = "Price N/A";

      if (sortedOptions.length > 0) {
        const firstPrice = sortedOptions[0]?.price;
        const lastPrice = sortedOptions[sortedOptions.length - 1]?.price;
        if (sortedOptions.length === 1) {
          // Only one option, show its price
          priceDisplay = formatNaira(firstPrice);
        } else if (
          firstPrice !== null &&
          firstPrice !== undefined &&
          lastPrice !== null &&
          lastPrice !== undefined &&
          firstPrice !== lastPrice
        ) {
          // Multiple options with different prices, show range
          priceDisplay = `${formatNaira(firstPrice)} - ${formatNaira(lastPrice)}`;
        } else if (firstPrice !== null && firstPrice !== undefined) {
          // Multiple options but all have the same price
          priceDisplay = formatNaira(firstPrice);
        } else if (lastPrice !== null && lastPrice !== undefined) {
          priceDisplay = formatNaira(lastPrice);
        }
      } else if (product.price !== null && product.price !== undefined) {
        priceDisplay = formatNaira(product.price);
      }

      return (
        <div className="flex-1">
          <Link
            href={`/product/${product.slug}`}
            className="overflow-hidden text-ellipsis h4-bold"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {product.name}
          </Link>
          {/* {console.log('Product in_season value:', product.in_season, 'for product:', product.name)} */}
          {product.in_season === true && (
            <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded font-semibold">
              In Season
            </span>
          )}
          {product.in_season === false && (
            <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded font-semibold">
              Out of Season
            </span>
          )}
          <div className="flex gap-2">
            <Rating rating={product.avg_rating || 0} />
            {typeof product.num_reviews === "number" &&
              product.num_reviews > 0 && (
                <span className="text-gray-600 text-sm">
                  ({product.num_reviews})
                </span>
              )}
          </div>

          <div className="flex flex-col">
            {sortedOptions.length > 0 ? (
              <span className="font-bold text-md whitespace-nowrap">
                {priceDisplay}
              </span>
            ) : (
              <ProductPrice
                isDeal={product.tags?.includes("todays-deal") || false}
                price={product.price || 0}
                listPrice={product.list_price || 0}
                forListing
              />
            )}
          </div>
        </div>
      );
    }, [product, sortedOptions]);

    const [optionPickerOpen, setOptionPickerOpen] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    const productImageSrc = useMemo(() => {
      if (selectedOptionData?.image) return selectedOptionData.image;
      if (product.images?.[0]) {
        if (typeof product.images[0] === "string") return product.images[0];
        if (
          typeof product.images[0] === "object" &&
          product.images[0] !== null &&
          "url" in product.images[0]
        ) {
          return (product.images[0] as { url: string }).url;
        }
      }
      return "/placeholder-product.png";
    }, [selectedOptionData, product.images]);

    const optionList = (
      <div className="space-y-3">
        {sortedOptions.map((option, idx) => {
          const isSelected = selectedOption === option.name;
          return (
            <div key={option.name} className="space-y-3">
              <motion.button
                onClick={() => {
                  handleOptionChange(option.name);
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={cn(
                  "w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                  isSelected
                    ? "border-[#1B6013] bg-[#F5FFF1] shadow-[0_10px_30px_rgba(27,96,19,0.08)]"
                    : "border-[#E4E7EC] bg-white hover:border-[#1B6013] hover:bg-[#F5FFF1]"
                )}
              >
                <span className="font-medium text-sm text-[#101828]">
                  {option.name}
                </span>
                <span className="text-sm text-[#475467]">
                  {formatNaira(option.price)}
                </span>
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
                      <p className="text-xs text-[#475467]">
                        {formatNaira(option.price)}
                      </p>
                    </div>
                    {currentCartItem && currentCartItem.quantity > 0 && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#F04438]"
                        onClick={handleRemoveFromCart}
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
                          handleQuantityChange(Math.max(quantity - 1, 0))
                        }
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-semibold text-[#0F172A]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        className="size-9 rounded-full bg-[#1B6013] text-white flex items-center justify-center text-lg"
                        onClick={() => handleQuantityChange(quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-2xl bg-[#1B6013] text-white py-3 font-semibold shadow-[0px_15px_35px_rgba(27,96,19,0.32)]"
                    onClick={() => {
                      handleUpdateCartQuantity(Math.max(quantity, 1));
                      setOptionPickerOpen(false);
                    }}
                  >
                    {currentCartItem ? "Update Cart" : "Add to Cart"}
                  </button>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    );

    const desktopOptionPicker = !isMobile ? (
      <Sheet open={optionPickerOpen} onOpenChange={setOptionPickerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md border-none p-0 bg-transparent"
        >
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="h-full bg-white flex flex-col rounded-l-[32px] shadow-[0_15px_60px_rgba(15,23,42,0.18)]"
          >
            <SheetHeader className="p-6 pb-4 text-left">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#9E9EA7] mb-1">
                Select option
              </p>
              <SheetTitle className="text-lg leading-tight text-[#0F172A]">
                {product.name}
              </SheetTitle>
              <SheetDescription className="text-xs text-[#6B7280]">
                Choose the option you want
              </SheetDescription>
            </SheetHeader>
            <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-5">
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-[#F4F4F5] flex-shrink-0">
                  <Image
                    src={productImageSrc}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {selectedOptionData?.name || sortedOptions[0]?.name}
                  </p>
                  <p className="text-xs text-[#475467]">
                    {selectedOptionData
                      ? formatNaira(selectedOptionData.price)
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
      isMobile && isClient
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
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-[#9E9EA7]">
                          Select option
                        </p>
                        <p className="text-base font-semibold text-[#0F172A]">
                          {product.name}
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

    const OptionsDropdown = useMemo(() => {
      if (sortedOptions.length === 0) return null;

      const currentValue = selectedOption || sortedOptions[0]?.name || "";
      const currentOption =
        sortedOptions.find((opt) => opt.name === currentValue) ||
        sortedOptions[0];

      return (
        <>
          {desktopOptionPicker}
          {mobileOptionPicker}
          <div className="w-full mt-2 max-w-xs min-w-[10rem]">
            <button
              onClick={() => setOptionPickerOpen(true)}
              className="w-full flex items-center justify-between rounded-lg border border-[#E4E7EC] bg-white px-3 py-2 text-left hover:border-[#1B6013] hover:bg-[#F5FFF1] transition-all"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {currentOption?.image && (
                  <Image
                    src={currentOption.image}
                    alt={currentOption.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-md object-cover flex-shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {currentOption?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentOption
                      ? formatNaira(currentOption.price)
                      : "Select"}
                  </p>
                </div>
              </div>
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </>
      );
    }, [
      sortedOptions,
      selectedOption,
      desktopOptionPicker,
      mobileOptionPicker,
      productImageSrc,
      product.name,
    ]);

    return hideBorder ? (
      <div className="flex flex-col">
        {ProductImage}
        {!hideDetails && (
          <>
            <div className="p-2 flex-1 text-center">
              {ProductDetails}
              {OptionsDropdown}
            </div>
          </>
        )}
      </div>
    ) : (
      <div className={cn("relative", !hideBorder && " rounded-[8px]")}>
        <div className="flex flex-col">
          <div className="">{ProductImage}</div>
        </div>
        {!hideDetails && (
          <>
            <div className="pt-2 pb-0 flex-1 gap-2">
              {ProductDetails}
              {OptionsDropdown}
            </div>
          </>
        )}
      </div>
    );
  }
);

ProductDetailsCard.displayName = "ProductDetailsCard";

export default ProductDetailsCard;
