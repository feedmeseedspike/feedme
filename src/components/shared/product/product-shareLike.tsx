"use client"

import { Heart, HeartOff, Share2 } from 'lucide-react'
import { FcLike } from 'react-icons/fc'
import React from 'react'
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { IProductInput } from 'src/types';
import { toggleLike } from 'src/store/features/wishlistSlice';


const ShareLike = ({product}: {product: any}) => {
  const dispatch = useDispatch();
  const likedProducts = useSelector((state: RootState) => state.likes.likedProducts);
  const isLiked = likedProducts.includes(product.slug);
  const pathname = usePathname();
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL}${pathname}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: productUrl,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(productUrl);
        toast.success("Link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link!");
      }
    }
  };
  return (
    <div className="grid grid-cols-2 gap-3 justify-center ite w-full">
      <button className="text-[#284625] bg-[#F2F8F1] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] flex justify-center items-center gap-2" onClick={handleShare}>
      <Share2 /> <span className="text-[15px]">Share</span>
      </button>
      <button className="text-[#284625] bg-[#F2F8F1] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] flex justify-center" onClick={() => dispatch(toggleLike(product.slug))}>
      {isLiked ? <Heart className="text-2xl fill-red-600 text-red-600" /> : <Heart className="text-2xl" />}
      </button>
    </div>
  )
}

export default ShareLike