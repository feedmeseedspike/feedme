"use client";

import {
  Share2,
  Copy,
  X,
  Facebook,
  Twitter,
  MessageCircle,
  Heart,
  Loader2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "src/store";
import {
  toggleFavorite,
  fetchFavorites,
} from "src/store/features/favoritesSlice";

const ShareLike = ({ product }: { product: any }) => {
  const pathname = usePathname();
  const productUrl = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_SITE_URL}${pathname}`
  );
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  // Get favorites state from Redux
  const favorites = useSelector(
    (state: RootState) => state.favorites.favorites
  );
  const isLoading = useSelector(
    (state: RootState) => state.favorites.isLoading
  );
  const isFavorited = product.id ? favorites.includes(product.id) : false;

  // Fetch favorites on mount
  useEffect(() => {
    dispatch(fetchFavorites());
  }, [dispatch]);

  // Handle favorite toggle
  const handleToggleLike = React.useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!product.id) return;

      try {
        await dispatch(toggleFavorite(product.id));
        toast[isFavorited ? "info" : "success"](
          `${product.name} ${
            isFavorited ? "removed from" : "added to"
          } wishlist`
        );
      } catch (error: any) {
        if (error.message === "You must be logged in to modify favorites") {
          window.location.href = `/login?callbackUrl=${encodeURIComponent(
            window.location.pathname
          )}`;
        } else {
          toast.error(error.message || "Failed to update favorites");
        }
      }
    },
    [dispatch, product.id, pathname, isFavorited]
  );

  // Handle share functionality
  const handleShare = async (platform: string) => {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}${pathname}`;
    const text = `Check out ${product.name} on our store!`;

    switch (platform) {
      case "copy":
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard!");
        } catch (err) {
          toast.error("Failed to copy link");
        }
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            text
          )}&url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
          "_blank"
        );
        break;
    }
    setOpen(false);
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="text-[#284625] bg-[#F2F8F1] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] flex justify-center items-center w-full"
            onClick={(e) => {
              // e.preventDefault();
              // e.stopPropagation();
            }}
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="ml-2">Share</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-4">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleShare("copy")}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
            <button
              onClick={() => handleShare("facebook")}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md"
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => handleShare("twitter")}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md"
            >
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
            </button>
            <button
              onClick={() => handleShare("whatsapp")}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <button
        className="text-[#284625] bg-[#F2F8F1] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] flex justify-center items-center w-full"
        onClick={handleToggleLike}
        aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-gray-500" />
        ) : isFavorited ? (
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-red-600 text-red-600" />
        ) : (
          <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
        <span className="ml-2">Wishlist</span>
      </button>
    </div>
  );
};

export default ShareLike;
