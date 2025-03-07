"use client";

import { Share2, Copy, X, Facebook, Twitter, MessageCircle, Heart } from "lucide-react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "src/store";
import { toggleLike } from "src/store/features/wishlistSlice";

const ShareLike = ({ product }: { product: any }) => {
  const pathname = usePathname();
  const productUrl = encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}${pathname}`);
  const dispatch = useDispatch();
  const likedProducts = useSelector((state: RootState) => state.likes.likedProducts); 
  const isLiked = likedProducts.includes(product.slug);
  const [open, setOpen] = useState(false);

  // Sharing URLs
  const whatsappShareUrl = `https://web.whatsapp.com/send?text=Check+out+this+product:+${product.name}%20${productUrl}%3Futm_source%3Dwhatsapp%26utm_medium%3Dsocial%26utm_campaign%3Dpdpshare`;
  const twitterShareUrl = `https://x.com/intent/tweet?url=${productUrl}%3Futm_source%3Dtwitter%26utm_medium%3Dsocial%26utm_campaign%3Dpdpshare&text=Check%20out%20this%20product%20on%20our%20store:`;
  const facebookShareUrl = `https://web.facebook.com/sharer/sharer.php?u=${productUrl}%3Futm_source%3Dfacebook%26utm_medium%3Dsocial%26utm_campaign%3Dpdpshare&quote=Check+out+this+product+on+our+store&_rdc=1&_rdr`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(decodeURIComponent(productUrl));
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link!");
    }
  };

  return (
    <div className="flex gap-3 w-full">
      {/* Share Button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="text-[#284625] bg-[#F2F8F1] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] flex justify-center items-center gap-2">
            <Share2 />
            <span className="text-[15px]">Share</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 bg-white shadow-lg rounded-lg p-3 flex flex-col gap-2">
          {/* Close Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Share this product</h3>
            <button onClick={() => setOpen(false)}>
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {/* Share Options */}
          <div className="flex flex-col gap-2">
            <a
              href={facebookShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:bg-gray-100 p-2 rounded-md"
            >
              <Facebook className="w-5 h-5 text-blue-600" />
              Share on Facebook
            </a>
            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:bg-gray-100 p-2 rounded-md"
            >
              <Twitter className="w-5 h-5 text-blue-400" />
              Share on Twitter
            </a>
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:bg-gray-100 p-2 rounded-md"
            >
              <MessageCircle className="w-5 h-5 text-green-500" />
              Share on WhatsApp
            </a>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 text-sm hover:bg-gray-100 p-2 rounded-md"
            >
              <Copy className="w-5 h-5 text-gray-600" />
              Copy Link
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Like Button */}
      <button
        className="text-[#284625] bg-[#F2F8F1] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] flex justify-center items-center w-full"
        onClick={() => dispatch(toggleLike(product.slug))}
      >
        {isLiked ? <Heart className="text-2xl fill-red-600 text-red-600" /> : <Heart className="text-2xl" />}
      </button>
    </div>
  );
};

export default ShareLike;
