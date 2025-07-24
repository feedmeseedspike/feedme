"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@components/ui/card";
import Rating from "./rating";
import { generateId, formatNaira } from "../../../lib/utils";
import ImageHover from "./image-hover";
import AddToCart from "./add-to-cart";
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
    const user = useUser();
    const router = useRouter();

    // Tanstack Query for Cart
    const { data: cartItems, isLoading: isLoadingCart } = useCartQuery();

    // Tanstack Query for Favorites
    const { data: favorites, isLoading: isLoadingFavorites } =
      useQuery(getFavoritesQuery());
    const isFavorited =
      product.id && favorites ? favorites.includes(product.id) : false;

    // Use mutations for adding/removing favorites
    const addFavoriteMutation = useAddFavoriteMutation();
    const removeFavoriteMutation = useRemoveFavoriteMutation();

    // Combined loading state
    const isLoading =
      isLoadingFavorites ||
      isLoadingCart ||
      addFavoriteMutation.isPending ||
      removeFavoriteMutation.isPending;

    // Get selected option from Redux
    const selectedOption = useSelector((state: RootState) =>
      product.id ? state.options.selectedOptions[product.id] : undefined
    );

    // Extract and sort product options
    const sortedOptions = useMemo(() => {
      const opts = Array.isArray(product.options) ? product.options : [];
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

    // Find the item in the cart
    const currentCartItem = useMemo(() => {
      if (!cartItems) return undefined;
      return cartItems.find((item) => {
        return (
          item.product_id === product.id &&
          JSON.stringify(item.option || null) ===
            JSON.stringify(selectedOptionData || null)
        );
      });
    }, [cartItems, product.id, selectedOptionData]);

    const [quantity, setQuantity] = useState(currentCartItem?.quantity ?? 1);
    const [showQuantityControls, setShowQuantityControls] = useState(
      Boolean(currentCartItem)
    );

    // Update local state when the item in the cart changes
    useEffect(() => {
      setQuantity(currentCartItem?.quantity ?? 1);
      setShowQuantityControls(Boolean(currentCartItem));
    }, [currentCartItem]);

    // Use cart mutations
    const updateCartMutation = useUpdateCartMutation();
    const removeCartItemMutation = useRemoveFromCartMutation();

    // Handler to update quantity via mutation
    const handleUpdateCartQuantity = useCallback(
      async (newQuantity: number) => {
        if (!product.id) return;

        if (!user) {
          showToast("Please log in to add items to cart", "error");
          router.push(
            `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
          );
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
              option: item.option,
              quantity: isTargetItem ? newQuantity : item.quantity,
              // Use product.price if item.option is null and item.price is not set
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
            option: selectedOptionData
              ? JSON.parse(JSON.stringify(selectedOptionData))
              : null,
            quantity: newQuantity,
            price: itemPriceForNew, // Use the determined price
          });
        }

        try {
          await updateCartMutation.mutateAsync(itemsForMutation);
        } catch (error: any) {
          console.error("Failed to update cart item quantity:", error);
          showToast("Failed to update cart.", "error");
        }
      },
      [
        product.id,
        product.price,
        product.bundleId,
        user,
        cartItems,
        selectedOptionData,
        showToast,
        router,
        updateCartMutation,
      ]
    );

    // Handler to remove item via mutation
    const handleRemoveFromCart = useCallback(async () => {
      if (!currentCartItem?.id) return;

      if (!user) {
        showToast("Please log in to modify cart", "error");
        router.push(
          `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
        );
        return;
      }

      try {
        await removeCartItemMutation.mutateAsync(currentCartItem.id);
        setShowQuantityControls(false);
        setQuantity(1);
      } catch (error: any) {
        console.error("Failed to remove cart item:", error);
        showToast("Failed to remove item from cart.", "error");
      }
    }, [currentCartItem, user, showToast, router, removeCartItemMutation]);

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
        showToast("This product is currently out of season and cannot be added to cart", "error");
        return;
      }

      if (!user) {
        showToast("Please log in to add items to cart", "error");
        router.push(
          `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
        );
        return;
      }

      setShowQuantityControls(true);
      handleUpdateCartQuantity(1);
    };

    const handleQuantityChange = useCallback(
      (newQuantity: number) => {
        if (!user) {
          showToast("Please log in to modify cart", "error");
          router.push(
            `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
          );
          return;
        }

        // Check if product is out of season and user is trying to increase quantity
        if (product.in_season === false && newQuantity > (currentCartItem?.quantity ?? 0)) {
          showToast("Cannot increase quantity for out of season products", "error");
          return;
        }

        if (newQuantity < 1) {
          handleRemoveFromCart();
        } else {
          handleUpdateCartQuantity(newQuantity);
        }
      },
      [user, showToast, router, handleRemoveFromCart, handleUpdateCartQuantity, product.in_season, currentCartItem?.quantity]
    );

    // Handle favorite toggle
    const handleToggleLike = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!product.id) return;

        if (!user) {
          showToast("Please log in to add favorites", "error");
          router.push(
            `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
          );
          return;
        }

        try {
          if (isFavorited) {
            await removeFavoriteMutation.mutateAsync(product.id);
            showToast(`${product.name} removed from favorites`, "info");
          } else {
            await addFavoriteMutation.mutateAsync(product.id);
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
            <AnimatePresence>
              {showQuantityControls ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-2 bg-white rounded-full shadow-md p-1 border border-gray-100"
                >
                  <button
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
                  >
                    {quantity === 1 ? (
                      <Trash2 className="size-[14px]" />
                    ) : (
                      <Minus className="size-[14px]" />
                    )}
                  </button>
                  <span className="text-sm font-medium w-4 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Check if product is out of season
                      if (product.in_season === false) {
                        showToast("Cannot increase quantity for out of season products", "error");
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
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Check if product is out of season
                    if (product.in_season === false) {
                      showToast("This product is currently out of season and cannot be added to cart", "error");
                      return;
                    }
                    
                    setShowQuantityControls(true);
                    handleUpdateCartQuantity(1);
                  }}
                  disabled={product.in_season === false}
                  className={cn(
                    "p-2 rounded-full backdrop-blur-sm shadow-md transition-colors",
                    product.in_season === false
                      ? "bg-gray-300 cursor-not-allowed opacity-50"
                      : "bg-[#1B6013]/90 hover:bg-[#1B6013]"
                  )}
                  aria-label={product.in_season === false ? "Product out of season" : "Add to cart"}
                >
                  <Plus className="w-4 h-4 text-white" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Product image */}
          <Link href={`/product/${product.slug}`} passHref>
            <div className={cn(
              "relative h-[10rem] lg:h-[12rem] w-full overflow-hidden rounded-lg",
            )}>
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
    }, [product.price, product.list_price, product.in_season, product.slug, product.images, product.name, selectedOptionData, sortedOptions, handleToggleLike, isLoading, isFavorited, showQuantityControls, quantity, handleRemoveFromCart, handleQuantityChange, showToast, handleUpdateCartQuantity]);

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

    const OptionsDropdown = useMemo(() => {
      if (sortedOptions.length === 0) return null;

      const currentValue = selectedOption || sortedOptions[0]?.name || "";

      return (
        <div className="w-full mt-2 max-w-xs min-w-[10rem]">
          <Select value={currentValue} onValueChange={handleOptionChange}>
            <SelectTrigger className="w-full !border-none min-w-[10rem] max-w-[18rem]">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent className="w-full min-w-[10rem] max-w-[18rem] max-h-[250px] overflow-y-auto z-50">
              {sortedOptions.map((option) => (
                <SelectItem
                  key={option.name}
                  value={option.name}
                  className="w-full"
                >
                  <div className="flex items-center gap-2 w-full">
                    {typeof option.image === "string" && (
                      <Image
                        src={option.image}
                        alt={option.name}
                        width={40}
                        height={40}
                        className="h-8 w-8 rounded-md object-cover"
                        loading="lazy"
                      />
                    )}
                    <div>
                      <p>{option.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatNaira(option.price)}
                      </p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }, [sortedOptions, selectedOption, handleOptionChange]);

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
