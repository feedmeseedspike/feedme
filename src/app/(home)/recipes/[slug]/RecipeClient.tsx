"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "src/lib/utils";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import AddToCart from "@components/shared/product/add-to-cart";
import Container from "@components/shared/Container";
import { 
  ChevronLeft, 
  ChefHat, 
  Share2, 
  Play,
  Clock,
  Youtube
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "src/hooks/useToast";

interface RecipeClientProps {
  bundle: any;
}

export default function RecipeClient({ bundle }: RecipeClientProps) {
  const { showToast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cook ${bundle.name} with FeedMe`,
          text: `Get all the ingredients for ${bundle.name} delivered!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!", "success");
    }
  };

  const renderVideo = () => {
    if (!bundle.video_url) return null;

    if (bundle.video_url.endsWith('.mp4') || bundle.video_url.includes('cloudinary')) {
        return (
            <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden bg-black shadow-2xl">
                 <video 
                    src={bundle.video_url} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-cover"
                    playsInline
                />
            </div>
        );
    }
    
    return (
        <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden bg-gray-900 flex flex-col items-center justify-center text-white p-8 text-center shadow-2xl">
            <Youtube className="text-red-500 mb-6" size={64} />
            <h3 className="text-2xl font-bold mb-6">Watch the Masterclass</h3>
            <a 
                href={bundle.video_url} 
                target="_blank" 
                rel="noreferrer"
                className="px-10 h-16 bg-[#D9FF00] text-[#1B6013] rounded-full font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
            >
                <Play className="fill-[#1B6013]" size={20} /> Open Social Video
            </a>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <Container className="py-12">
        <div className="mb-12 flex items-center justify-between">
           <Link href="/recipes" className="flex items-center gap-2 text-gray-500 hover:text-[#1B6013] transition-colors font-bold uppercase tracking-widest text-xs">
              <ChevronLeft size={18} /> Back to Library
           </Link>
           <button onClick={handleShare} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold uppercase tracking-widest text-xs">
              <Share2 size={18} /> Share Recipe
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 mb-24">
           {/* Visual Area */}
           <div className="space-y-8">
              {isPlaying ? (
                <div className="relative">
                   {renderVideo()}
                   <button 
                      onClick={() => setIsPlaying(false)}
                      className="mt-6 text-[#1B6013] font-bold text-sm uppercase tracking-widest hover:underline"
                   >
                      &larr; Switch back to image
                   </button>
                </div>
              ) : (
                <div className="relative aspect-square w-full rounded-[3rem] overflow-hidden border border-gray-100 shadow-xl group">
                   <Image
                      src={bundle.thumbnail_url || "/images/placeholder-recipe.jpg"}
                      alt={bundle.name}
                      fill
                      className="object-cover"
                      priority
                   />
                   {bundle.video_url && (
                      <div className="absolute inset-0 flex items-center justify-center">
                         <button 
                            onClick={() => setIsPlaying(true)}
                            className="w-24 h-24 rounded-full bg-white/90 backdrop-blur-xl flex items-center justify-center text-[#1B6013] shadow-2xl hover:scale-110 transition-transform"
                         >
                            <Play className="fill-current ml-1" size={32} />
                         </button>
                      </div>
                   )}
                </div>
              )}
           </div>

           {/* Content Area */}
           <div className="flex flex-col justify-center">
              <div className="mb-10">
                 <CustomBreadcrumb />
              </div>
              
              <h1 className="text-4xl md:text-7xl font-black text-gray-950 uppercase tracking-tighter mb-8 leading-none">
                 {bundle.name}
              </h1>

              <div className="flex flex-wrap items-center gap-8 py-8 border-y border-gray-100 mb-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#1B6013] flex items-center justify-center text-[#D9FF00] font-black text-xl">
                       {(bundle.chef_name || "F")[0]}
                    </div>
                    <div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Cooked By</p>
                       <p className="font-bold text-gray-900">{bundle.chef_name || "FeedMe Chef"}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 border-l pl-8 border-gray-100">
                    <Clock className="text-orange-500" size={24} />
                    <div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Prep Time</p>
                       <p className="font-bold text-gray-900">25 MINS</p>
                    </div>
                 </div>
              </div>

              <div 
                 className="text-lg text-gray-500 leading-relaxed mb-12 prose prose-green"
                 dangerouslySetInnerHTML={{ __html: bundle.description || "" }} 
              />

              <div className="p-8 bg-gray-50 rounded-[2.5rem] flex items-center justify-between gap-6 border border-gray-100">
                 <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Bundle Total</p>
                    <p className="text-3xl font-black text-gray-950">{formatNaira(bundle.price)}</p>
                 </div>
                 <AddToCart
                    item={{
                      id: bundle.id,
                      name: bundle.name,
                      slug: bundle.slug || "bundle",
                      category: "Bundle",
                      price: bundle.price,
                      images: bundle.thumbnail_url ? [bundle.thumbnail_url] : [],
                      countInStock: 50,
                      bundleId: bundle.id,
                    }}
                    className="!bg-[#1B6013] !h-16 !px-10 !rounded-2xl !font-black !text-lg shadow-xl shadow-green-100"
                />
              </div>
           </div>
        </div>

        {/* Ingredients List Clean */}
        <div className="pt-24 border-t border-gray-100">
           <h2 className="text-3xl font-black text-gray-950 uppercase tracking-tighter mb-12">What&apos;s in the box?</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundle.products?.map((product: any) => (
                 <div key={product.id} className="flex items-center gap-6 p-6 rounded-[2rem] bg-white border border-gray-100 hover:border-[#1B6013] transition-all group">
                    <div className="w-20 h-20 relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group-hover:scale-105 transition-transform">
                       <Image 
                          src={product.images?.[0] || "/images/placeholder-recipe.jpg"} 
                          alt={product.name} 
                          fill 
                          className="object-cover"
                       />
                    </div>
                    <div>
                       <h4 className="font-bold text-gray-900 leading-tight mb-1">{product.name}</h4>
                       <p className="text-sm font-black text-[#1B6013]">{formatNaira(product.price)}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </Container>
    </div>
  );
}
