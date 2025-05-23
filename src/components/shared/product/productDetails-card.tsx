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
import { createClient } from "src/utils/supabase/client";
import { debounce } from "lodash";
import {
  addItem,
  updateCartItem,
  removeItem,
} from "src/store/features/cartSlice";
import { toggleFavorite } from "src/store/features/favoritesSlice";
import { fetchFavorites } from "src/store/features/favoritesSlice";
import { cn } from "src/lib/utils";

interface ProductOption {
  name: string;
  price: number;
  image?: string;
  stockStatus?: "In Stock" | "Out of Stock";
}

interface ProductDetailsCardProps {
  product: IProductInput;
  hideDetails?: boolean;
  hideBorder?: boolean;
  hideAddToCart?: boolean;
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
    const selectedOption = useSelector((state: RootState) =>
      product.id ? state.options.selectedOptions[product.id] : undefined
    );
    const [quantity, setQuantity] = useState(1);
    const [showQuantityControls, setShowQuantityControls] = useState(false);

    // Get favorites state from Redux
    const favorites = useSelector(
      (state: RootState) => state.favorites.favorites
    );
    const isFavorited = product.id ? favorites.includes(product.id) : false;
    const isLoading = useSelector(
      (state: RootState) => state.favorites.isLoading
    );

    // Fetch favorites on mount
    useEffect(() => {
      dispatch(fetchFavorites());
    }, [dispatch]);

    // Handle favorite toggle
    const handleToggleLike = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!product.id) return;

        try {
          await dispatch(toggleFavorite(product.id));
          showToast(
            isFavorited
              ? `${product.name} removed from favorites`
              : `${product.name} added to favorites`,
            isFavorited ? "info" : "success"
          );
        } catch (error: any) {
          if (error.message === "You must be logged in to modify favorites") {
            window.location.href = `/login?callbackUrl=${encodeURIComponent(
              window.location.pathname
            )}`;
          } else {
            showToast(error.message || "Failed to update favorites", "error");
          }
        }
      },
      [dispatch, product.id, product.name, isFavorited, showToast]
    );

    // Extract and sort product options
    const sortedOptions = useMemo(() => {
      if (!product.options || product.options.length === 0) return [];
      return [...product.options].sort((a, b) => a.price - b.price);
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
      setShowQuantityControls(true);
    };

    const handleQuantityChange = (newQuantity: number) => {
      if (newQuantity < 1) {
        setShowQuantityControls(false);
        setQuantity(1);
      } else {
        setQuantity(newQuantity);
      }
    };

    const ProductImage = useMemo(() => {
      const discountPercent = Math.round(
        100 - (product.price / (product.list_price || product.price)) * 100
      );

      const currentOption =
        selectedOptionData ||
        (sortedOptions.length > 0 ? sortedOptions[0] : null);

      const cartItem = {
        clientId: generateId(),
        product: product.id || "",
        countInStock: product.countInStock || 0,
        name: product.name,
        slug: product.slug,
        price: currentOption?.price || product.price,
        quantity: quantity,
        image: product.images?.[0] || "",
        options: sortedOptions.map((opt) => ({
          name: opt.name,
          price: opt.price,
          image: typeof opt.image === "string" ? opt.image : undefined,
          stockStatus: opt.stockStatus,
        })),
        selectedOption: currentOption?.name,
        option: currentOption
          ? {
              name: currentOption.name,
              price: currentOption.price,
              image:
                typeof currentOption.image === "string"
                  ? currentOption.image
                  : undefined,
            }
          : undefined,
      };

      const handleAddSuccess = () => {
        showToast(
          `${product.name}${
            currentOption ? ` (${currentOption.name})` : ""
          } added to cart!`,
          "success"
        );
      };

      const handleAddError = () => {
        showToast(
          `Failed to add ${product.name} to cart. Please try again.`,
          "error"
        );
      };

      const handleOutOfStock = () => {
        showToast(`${product.name} is out of stock!`, "warning");
      };

      return (
        <div className="relative">
          {/* Like button with animation */}
          <motion.button
            onClick={handleToggleLike}
            disabled={isLoading}
            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-gray-100 transition-colors shadow-md"
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
                  className={`w-4 h-4 transition-colors ${
                    isFavorited ? "fill-red-600 text-red-600" : "text-gray-700"
                  }`}
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
                        // Remove from cart when clicking trash at quantity 1
                        dispatch(
                          removeItem({
                            productId: item.product,
                            selectedOption: selectedOptionData?.name,
                          })
                        );
                      } else {
                        handleQuantityChange(quantity - 1);
                        // Update cart quantity when decreasing
                        dispatch(
                          updateCartItem({
                            productId: item.product,
                            selectedOption: selectedOptionData?.name,
                            quantity: quantity - 1,
                          })
                        );
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
                      const newQuantity = quantity + 1;
                      handleQuantityChange(newQuantity);
                      // Update cart quantity when increasing
                      dispatch(
                        updateCartItem({
                          productId: item.product,
                          selectedOption: selectedOptionData?.name,
                          quantity: newQuantity,
                        })
                      );
                    }}
                    className="p-1 rounded-full bg-[#1B6013]/70 backdrop-blur-sm shadow-md hover:bg-[#1B6013]/90 transition-colors"
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
                    // Show quantity controls
                    setShowQuantityControls(true);
                    // Add to cart with quantity 1
                    const cartItem = {
                      clientId: generateId(),
                      product: product.id || "",
                      countInStock: product.countInStock || 0,
                      name: product.name,
                      slug: product.slug,
                      price: selectedOptionData?.price || product.price,
                      quantity: 1,
                      image: product.images?.[0] || "",
                      options: sortedOptions,
                      selectedOption: selectedOptionData?.name,
                      option: selectedOptionData
                        ? {
                            name: selectedOptionData.name,
                            price: selectedOptionData.price,
                            image: selectedOptionData.image,
                          }
                        : undefined,
                    };
                    dispatch(addItem({ item: cartItem, quantity: 1 }));
                    showToast(
                      `${product.name}${
                        selectedOptionData
                          ? ` (${selectedOptionData.name})`
                          : ""
                      } added to cart!`,
                      "success"
                    );
                  }}
                  className="p-2 rounded-full bg-[#1B6013]/90 backdrop-blur-sm shadow-md hover:bg-[#1B6013] transition-colors"
                  aria-label="Add to cart"
                >
                  <Plus className="w-4 h-4 text-white" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Product image */}
          <Link href={`/product/${product.slug}`} passHref>
            <div className="relative h-[8rem] sm:h-[10rem] lg:h-[12rem] w-full overflow-hidden rounded-lg">
              {product.list_price && product.list_price > product.price ? (
                <div className="absolute top-1 left-1 bg-[#1B6013] rounded-tl-lg rounded-r-full px-4 py-[6px] text-white text-xs font-semibold tracking-wider z-10">
                  {discountPercent}% Off
                </div>
              ) : null}
              {product.images?.length > 1 ? (
                <ImageHover
                  src={product.images[0]}
                  hoverSrc={product.images[1]}
                  alt={product.name}
                />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={product.images?.[0] || "/placeholder-product.png"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
            </div>
          </Link>
        </div>
      );
    }, [
      product,
      isFavorited,
      handleToggleLike,
      selectedOptionData,
      sortedOptions,
      quantity,
      showQuantityControls,
      showToast,
      isLoading,
    ]);

    const ProductDetails = useMemo(() => {
      const priceRange =
        sortedOptions.length > 0
          ? `${formatNaira(sortedOptions[0].price)} - ${formatNaira(
              sortedOptions[sortedOptions.length - 1].price
            )}`
          : formatNaira(product.price);

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
          <div className="flex gap-2">
            <Rating rating={product.avg_rating || 0} />
            <span className="text-gray-600 text-sm">
              ({product.num_reviews || 0})
            </span>
          </div>

          <div className="flex flex-col">
            {sortedOptions.length > 0 ? (
              <span className="font-bold text-md whitespace-nowrap">
                {priceRange}
              </span>
            ) : (
              <ProductPrice
                isDeal={product.tags?.includes("todays-deal") || false}
                price={product.price}
                listPrice={product.list_price}
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
        <div className="w-[8rem] mt-2">
          <Select value={currentValue} onValueChange={handleOptionChange}>
            <SelectTrigger className="w-full !border-none">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent className="w-fit">
              {sortedOptions.map((option) => (
                <SelectItem key={option.name} value={option.name}>
                  <div className="flex items-center gap-2 w-fit">
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
