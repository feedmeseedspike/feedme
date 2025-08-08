"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useState, useEffect } from "react";
import { formatNaira, toSlug, cn } from "src/lib/utils";
import { Tables } from "@utils/database.types";
import Rating from "@components/shared/product/rating";
import { Heart, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "src/hooks/useToast";
import { useUser } from "src/hooks/useUser";
import { useRouter } from "next/navigation";
import { useAnonymousCart } from "src/hooks/useAnonymousCart";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useCartQuery,
  useUpdateCartMutation,
  useRemoveFromCartMutation,
  ItemToUpdateMutation,
} from "src/queries/cart";

interface BundleCardProps {
  bundle: Tables<'bundles'>;
  hideDetails?: boolean;
  hideBorder?: boolean;
  hideAddToCart?: boolean;
}

const BundleCard: React.FC<BundleCardProps> = ({ 
  bundle, 
  hideDetails = false, 
  hideBorder = false, 
  hideAddToCart = false 
}) => {
  const bundleSlug = toSlug(bundle.name || '');
  const { showToast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const anonymousCart = useAnonymousCart();
  const queryClient = useQueryClient();

  // Cart queries and mutations
  const { data: cartItems, isLoading: isLoadingCart } = useCartQuery();
  const updateCartMutation = useUpdateCartMutation();
  const removeCartItemMutation = useRemoveFromCartMutation();

  // Bundle favorites using localStorage (since favorites table only supports products)
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bundle_favorites');
      if (saved) {
        setLocalFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading bundle favorites:', error);
    }
  }, []);

  const isFavorited = localFavorites.includes(bundle.id);

  // Save to localStorage
  const saveFavorites = (favorites: string[]) => {
    try {
      localStorage.setItem('bundle_favorites', JSON.stringify(favorites));
      setLocalFavorites(favorites);
    } catch (error) {
      console.error('Error saving bundle favorites:', error);
    }
  };

  // Cart state management
  const currentCartItem = React.useMemo(() => {
    if (user) {
      if (!cartItems) return undefined;
      return cartItems.find((item) => item.bundle_id === bundle.id);
    } else {
      return anonymousCart.items.find((item) => item.bundle_id === bundle.id);
    }
  }, [user, cartItems, anonymousCart.items, bundle.id]);

  const [quantity, setQuantity] = useState(currentCartItem?.quantity ?? 1);
  const [showQuantityControls, setShowQuantityControls] = useState(Boolean(currentCartItem));

  useEffect(() => {
    setQuantity(currentCartItem?.quantity ?? 1);
    setShowQuantityControls(Boolean(currentCartItem));
  }, [currentCartItem]);

  const isLoading = isLoadingFavorites || (user && isLoadingCart);

  // Handle favorite toggle using localStorage
  const handleToggleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!bundle.id) return;

      setIsLoadingFavorites(true);
      
      try {
        let newFavorites: string[];
        
        if (isFavorited) {
          // Remove from favorites
          newFavorites = localFavorites.filter(id => id !== bundle.id);
          saveFavorites(newFavorites);
          showToast(`${bundle.name} removed from wishlist`, "info");
        } else {
          // Add to favorites
          newFavorites = [...localFavorites, bundle.id];
          saveFavorites(newFavorites);
          showToast(`${bundle.name} added to wishlist`, "success");
        }
      } catch (error) {
        console.error("Error toggling bundle favorite:", error);
        showToast("Failed to update wishlist", "error");
      } finally {
        setIsLoadingFavorites(false);
      }
    },
    [bundle.id, bundle.name, isFavorited, localFavorites, saveFavorites, showToast]
  );

  // Handle cart operations
  const handleUpdateCartQuantity = useCallback(
    async (newQuantity: number) => {
      if (!bundle.id) return;

      if (!user) {
        // Handle anonymous cart
        const existingAnonymousItem = anonymousCart.items.find(
          (item) => item.bundle_id === bundle.id
        );

        if (newQuantity === 0) {
          if (existingAnonymousItem) {
            anonymousCart.removeItem(existingAnonymousItem.id);
            showToast(`${bundle.name} removed from cart`, "info");
          }
        } else {
          if (existingAnonymousItem) {
            anonymousCart.updateQuantity(existingAnonymousItem.id, newQuantity);
          } else {
            anonymousCart.addItem(null, newQuantity, bundle.price ?? 0, null, bundle.id, null);
          }
          showToast(
            `${bundle.name} ${newQuantity === 1 ? 'added to' : 'updated in'} cart`,
            "success"
          );
        }
        return;
      }

      const currentItems = cartItems || [];
      const itemsForMutation: ItemToUpdateMutation[] = currentItems
        .map((item) => {
          const isTargetItem = item.bundle_id === bundle.id;
          return {
            product_id: item.product_id || null,
            bundle_id: item.bundle_id || null,
            offer_id: item.offer_id || null,
            option: item.option,
            quantity: isTargetItem ? newQuantity : item.quantity,
            price: item.price ?? bundle.price ?? 0,
          };
        })
        .filter((item) => item.quantity > 0);

      const targetItemExistsInMutationArray = itemsForMutation.some(
        (item) => item.bundle_id === bundle.id
      );

      if (newQuantity > 0 && !targetItemExistsInMutationArray) {
        itemsForMutation.push({
          product_id: null,
          bundle_id: bundle.id,
          offer_id: null,
          option: null,
          quantity: newQuantity,
          price: bundle.price ?? 0,
        });
      }

      try {
        await updateCartMutation.mutateAsync(itemsForMutation);
      } catch (error: any) {
        console.error("Failed to update cart:", error);
        showToast("Failed to update cart.", "error");
      }
    },
    [bundle.id, bundle.name, bundle.price, user, cartItems, anonymousCart, showToast, updateCartMutation]
  );

  const handleRemoveFromCart = useCallback(async () => {
    if (!currentCartItem?.id) return;

    if (!user) {
      anonymousCart.removeItem(currentCartItem.id);
      setShowQuantityControls(false);
      setQuantity(1);
      showToast(`${bundle.name} removed from cart`, "info");
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
  }, [currentCartItem, user, anonymousCart, bundle.name, showToast, removeCartItemMutation]);

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setShowQuantityControls(true);
    setQuantity(1);
    handleUpdateCartQuantity(1);
  };

  const handleQuantityChange = useCallback(
    (newQuantity: number) => {
      if (newQuantity < 1) {
        handleRemoveFromCart();
      } else {
        handleUpdateCartQuantity(newQuantity);
      }
    },
    [handleRemoveFromCart, handleUpdateCartQuantity]
  );

  const BundleImage = () => (
    <div className="relative">
      {/* Like button with animation - hide in slider mode */}
      {!hideAddToCart && (
        <motion.button
          onClick={handleToggleLike}
          disabled={!!isLoading}
          className={cn(
            "absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-gray-100 transition-colors shadow-md",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
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
      )}

      {/* Add to cart button - hide in slider mode */}
      {!hideAddToCart && (
        <div className="absolute bottom-2 right-2 z-10">
          {showQuantityControls ? (
            <div className="flex items-center gap-2 bg-white rounded-full shadow-md p-1 border border-gray-100">
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
                aria-label={quantity === 1 ? "Remove item" : "Decrease quantity"}
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
                }}
                className="p-1 rounded-full bg-[#1B6013]/70 hover:bg-[#1B6013]/90 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCartClick}
              className="p-2 rounded-full bg-[#1B6013]/90 hover:bg-[#1B6013] hover:shadow-lg transition-all duration-200"
              aria-label="Add to cart"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      )}

      {/* Bundle image */}
      <Link href={`/bundles/${bundleSlug}`} passHref>
        <div className={cn(
          hideAddToCart 
            ? "relative h-[100px] w-[120px] md:h-[135px] md:w-[160px] bg-[#F2F4F7] overflow-hidden rounded-[8px]"
            : "relative h-[10rem] lg:h-[12rem] w-full overflow-hidden rounded-lg"
        )}>
          <Image
            src={bundle.thumbnail_url || "/placeholder-product.png"}
            alt={bundle.name || "Bundle"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover",
              hideAddToCart 
                ? "w-full h-full" 
                : "transition-transform duration-300 ease-in-out hover:scale-105 h-full w-full"
            )}
            onError={(e) => {
              e.currentTarget.src = "/placeholder-product.png";
            }}
          />
        </div>
      </Link>
    </div>
  );

  const BundleDetails = () => (
    <div className={cn(
      hideAddToCart 
        ? "flex flex-col space-y-1 w-[120px] md:w-[160px]" 
        : "flex-1"
    )}>
      <Link
        href={`/bundles/${bundleSlug}`}
        className={cn(
          hideAddToCart 
            ? "overflow-hidden h4-bold text-ellipsis leading-5 max-w-[10rem]"
            : "overflow-hidden text-ellipsis h4-bold",
        )}
        style={!hideAddToCart ? {
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        } : undefined}
      >
        {bundle.name}
      </Link>
      
      {/* Rating - only show in full mode */}
      {!hideAddToCart && (
        <div className="flex gap-2">
          <Rating rating={(bundle as any)?.avg_rating || 0} />
          {typeof (bundle as any)?.num_reviews === "number" &&
            (bundle as any)?.num_reviews > 0 && (
              <span className="text-gray-600 text-sm">
                ({(bundle as any).num_reviews})
              </span>
            )}
        </div>
      )}
      
      <div className="flex flex-col">
        <span className={cn(
          hideAddToCart 
            ? "text-[14px] text-[#1B6013]"
            : "font-bold text-md whitespace-nowrap"
        )}>
          {formatNaira(bundle.price || 0)}
        </span>
      </div>
    </div>
  );

  return (
    <div className={cn(
      hideAddToCart 
        ? "flex flex-col mb-4 md:pb-8 gap-2"
        : "relative rounded-[8px]"
    )}>
      {hideAddToCart ? (
        // Slider mode - match ProductCard layout
        <>
          <BundleImage />
          {!hideDetails && (
            <div>
              <BundleDetails />
            </div>
          )}
        </>
      ) : (
        // Full mode - original layout
        <>
          <div className="flex flex-col">
            <div className="">
              <BundleImage />
            </div>
          </div>
          <div className="pt-2 pb-0 flex-1 gap-2">
            <BundleDetails />
          </div>
        </>
      )}
    </div>
  );
};

BundleCard.displayName = "BundleCard";

export default BundleCard;