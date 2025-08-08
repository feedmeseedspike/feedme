"use client";

import {
  Share2,
  Copy,
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
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addToFavorite, removeFromFavorite, isProductFavorited } from "src/lib/actions/favourite.actions";

interface BundleShareLikeProps {
  bundle: any;
}

export default function BundleShareLikeClient({ bundle }: BundleShareLikeProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Query to check if bundle is favorited (treating bundle as product)
  const { data: isFavorited = false } = useQuery({
    queryKey: ["is-favorited", bundle.id],
    queryFn: () => isProductFavorited(bundle.id),
    enabled: !!bundle.id,
  });

  // Mutation to add to favorites
  const addToFavoriteMutation = useMutation({
    mutationFn: () => addToFavorite(bundle.id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["is-favorited", bundle.id] });
        toast.success(`${bundle.name} added to wishlist`);
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add to wishlist");
    },
  });

  // Mutation to remove from favorites
  const removeFromFavoriteMutation = useMutation({
    mutationFn: () => removeFromFavorite(bundle.id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["is-favorited", bundle.id] });
        toast.info(`${bundle.name} removed from wishlist`);
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to remove from wishlist");
    },
  });

  // Handle favorite toggle
  const handleToggleLike = React.useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!bundle.id) return;

      if (isFavorited) {
        removeFromFavoriteMutation.mutate();
      } else {
        addToFavoriteMutation.mutate();
      }
    },
    [bundle.id, isFavorited, addToFavoriteMutation, removeFromFavoriteMutation]
  );

  const isLoading = addToFavoriteMutation.isPending || removeFromFavoriteMutation.isPending;

  // Handle share functionality
  const handleShare = async (platform: string) => {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}${pathname}`;
    const text = `Check out ${bundle.name} on our store!`;

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
        <PopoverContent className="w-[200px] bg-white p-4">
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
}