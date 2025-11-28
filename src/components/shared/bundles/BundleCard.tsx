"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useState, useEffect } from "react";
import { formatNaira, toSlug, cn } from "src/lib/utils";
import { Tables } from "@utils/database.types";
import { Heart, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "src/hooks/useToast";
import AddToCart from "@components/shared/product/add-to-cart";

interface BundleCardProps {
  bundle: Tables<"bundles">;
  hideDetails?: boolean;
  hideBorder?: boolean;
  hideAddToCart?: boolean;
}

const BundleCard: React.FC<BundleCardProps> = ({
  bundle,
  hideDetails = false,
  hideBorder = false,
  hideAddToCart = false,
}) => {
  const bundleSlug = toSlug(bundle.name || "");
  const { showToast } = useToast();

  // Bundle favorites using localStorage (since favorites table only supports products)
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bundle_favorites");
      if (saved) {
        setLocalFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading bundle favorites:", error);
    }
  }, []);

  const isFavorited = localFavorites.includes(bundle.id);

  // Save to localStorage
  const saveFavorites = useCallback((favorites: string[]) => {
    try {
      localStorage.setItem("bundle_favorites", JSON.stringify(favorites));
      setLocalFavorites(favorites);
    } catch (error) {
      console.error("Error saving bundle favorites:", error);
    }
  }, []);

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
          newFavorites = localFavorites.filter((id) => id !== bundle.id);
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
    [
      bundle.id,
      bundle.name,
      isFavorited,
      localFavorites,
      saveFavorites,
      showToast,
    ]
  );

  const BundleImage = () => (
    <div className="relative h-[100px] w-[120px] md:h-[135px] md:w-[160px]">
      <Link href={`/bundles/${bundleSlug}`} className="block h-full w-full">
        <div className="relative w-full h-full bg-[#F2F4F7] overflow-hidden rounded-[8px]">
          <Image
            src={bundle.thumbnail_url || "/images/placeholder-banner.jpg"}
            alt={bundle.name || "Bundle"}
            fill
            sizes="(max-width: 768px) 120px, 160px"
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/images/placeholder-banner.jpg";
            }}
          />
        </div>
      </Link>

      {!hideAddToCart && !!bundle.id && (
        <div className="absolute bottom-1 right-1.5 md:bottom-[4px] md:right-[4px] z-10">
          <AddToCart
            minimal
            item={{
              id: bundle.id,
              name: bundle.name || "",
              slug: bundleSlug,
              category: "",
              price: bundle.price ?? 0,
              images: bundle.thumbnail_url ? [bundle.thumbnail_url] : [],
              countInStock: null,
              options: [],
              option: null,
              selectedOption: undefined,
              iconOnly: true,
              bundleId: bundle.id,
            }}
          />
        </div>
      )}

      {/* Like button with animation - hide in slider mode */}
      {!hideAddToCart && (
        <motion.button
          onClick={handleToggleLike}
          disabled={!!isLoadingFavorites}
          className={cn(
            "absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-gray-100 transition-colors shadow-md",
            isLoadingFavorites && "opacity-50 cursor-not-allowed"
          )}
          aria-label={
            isFavorited ? "Remove from favorites" : "Add to favorites"
          }
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
        >
          {isLoadingFavorites ? (
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
    </div>
  );

  const BundleDetails = () => (
    <div className="flex flex-col space-y-1 w-[120px] md:w-[160px]">
      <Link
        href={`/bundles/${bundleSlug}`}
        className="overflow-hidden h4-bold text-ellipsis leading-5 max-w-[10rem]"
      >
        {bundle.name}
      </Link>
      <span className="text-[14px] text-[#1B6013]">
        {formatNaira(bundle.price || 0)}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col mb-4 md:pb-8 gap-2">
      <BundleImage />
      {!hideDetails && (
        <div>
          <BundleDetails />
        </div>
      )}
    </div>
  );
};

BundleCard.displayName = "BundleCard";

export default React.memo(BundleCard);
