"use client";

import React, { useState, useMemo } from "react";
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
  Youtube,
  ChevronDown,
  Check
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "src/hooks/useToast";
import { useCartQuery, useUpdateCartMutation } from "src/queries/cart";
import RatingForm from "@components/recipes/RatingForm";
import CommentSection from "@components/recipes/CommentSection";
import UserPhotosGallery from "@components/recipes/UserPhotosGallery";
import PhotoUploadModal from "@components/recipes/PhotoUploadModal";
import BookmarkButton from "@components/recipes/BookmarkButton";

interface RecipeClientProps {
  bundle: any;
}

export default function RecipeClient({ bundle }: RecipeClientProps) {
  const { showToast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  
  // Flexible Bundle State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(bundle.products?.map((p: any) => p.id) || [])
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    bundle.products?.forEach((p: any) => {
      if (p.options && p.options.length > 0) {
        initial[p.id] = p.options[0];
      }
    });
    return initial;
  });

  // Robust customization check: size OR any option changed from default
  const isCustomized = useMemo(() => {
    if (selectedIds.size !== (bundle.products?.length || 0)) return true;
    
    for (const p of bundle.products || []) {
      if (p.options && p.options.length > 0) {
        const defaultName = p.options[0].name;
        if (selectedOptions[p.id]?.name !== defaultName) return true;
      }
    }
    return false;
  }, [selectedIds, selectedOptions, bundle.products]);

  const toggleProduct = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const setProductOption = (productId: string, option: any) => {
    setSelectedOptions(prev => ({ ...prev, [productId]: option }));
  };

  // Calculate the total based on current selection
  const ingredientsSum = useMemo(() => {
    if (!bundle.products) return 0;
    return bundle.products
      .filter((p: any) => selectedIds.has(p.id))
      .reduce((sum: number, p: any) => {
        const option = selectedOptions[p.id];
        const price = Number(option?.price) || Number(p.price) || 0;
        return sum + price;
      }, 0);
  }, [bundle.products, selectedIds, selectedOptions]);

  // Priority: Sum of ingredients for a flexible builder.
  // We can show the bundle price as a discount if it exists.
  const finalTotal = ingredientsSum;

  const savings = useMemo(() => {
    // If it's the full bundle and the set bundle price is lower than the sum of items,
    // we show the savings.
    if (!isCustomized && bundle.price && ingredientsSum > bundle.price) {
      return ingredientsSum - bundle.price;
    }
    return 0;
  }, [isCustomized, bundle.price, ingredientsSum]);

  // Fetch cart data for merging
  const { data: cartItems } = useCartQuery();
  const updateCartMutation = useUpdateCartMutation();

  const handleAddCustomBox = async () => {
    try {
      const newItems: any[] = [];
      
      // Start with current cart items
      if (cartItems) {
        cartItems.forEach(item => {
          newItems.push({
            product_id: item.product_id,
            bundle_id: item.bundle_id,
            offer_id: item.offer_id,
            black_friday_item_id: item.black_friday_item_id,
            option: item.option,
            quantity: item.quantity,
            price: item.price
          });
        });
      }

      // Add or Update with selected items from the bundle
      bundle.products.filter((p: any) => selectedIds.has(p.id)).forEach((product: any) => {
        const option = selectedOptions[product.id];
        const productPrice = option?.price || product.price || 0;
        
        // Check if already in cart (same product + same option)
        const existingIndex = newItems.findIndex(item => 
          item.product_id === product.id && 
          JSON.stringify(item.option || null) === JSON.stringify(option || null)
        );

        if (existingIndex > -1) {
          newItems[existingIndex].quantity += 1;
        } else {
          newItems.push({
            product_id: product.id,
            option: option || null,
            quantity: 1,
            price: productPrice
          });
        }
      });

      await updateCartMutation.mutateAsync(newItems);
      showToast("Custom box added to cart!", "success");
    } catch (err) {
      console.error("Error adding custom box:", err);
      showToast("Failed to add items to cart", "error");
    }
  };

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

    // Handle Direct Video Files (MP4) or Cloudinary
    if (bundle.video_url.endsWith('.mp4') || bundle.video_url.includes('cloudinary')) {
        return (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl">
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

    // Handle YouTube Links for Inline Playback
    const youtubeId = bundle.video_url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
    if (youtubeId) {
        return (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl">
                <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                ></iframe>
            </div>
        );
    }
    
    // Fallback for other platform links (Instagram/TikTok etc)
    return (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 flex flex-col items-center justify-center text-white p-8 text-center shadow-2xl">
            <Play className="text-[#F0800F] mb-6" size={64} />
            <h3 className="text-2xl font-bold mb-6">Watch the Masterclass</h3>
            <p className="text-sm text-gray-400 mb-8 max-w-xs mx-auto">Click below to watch this masterclass on the social platform.</p>
            <a 
                href={bundle.video_url} 
                target="_blank" 
                rel="noreferrer"
                className="px-10 h-16 bg-[#F0800F] text-white rounded-xl font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
            >
                <Play className="fill-white" size={20} /> Watch Masterclass
            </a>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-32 font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* --- BREADCRUMB --- */}
      <div className="border-b border-gray-100 py-4 mb-8">
        <Container>
          <CustomBreadcrumb />
        </Container>
      </div>

      <Container className="py-2">
        <div className="mb-10 flex items-center justify-between">
           <Link href="/recipes" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold uppercase tracking-widest text-[10px]">
              <ChevronLeft size={16} /> Back to Library
           </Link>
           <button onClick={handleShare} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold uppercase tracking-widest text-[10px]">
              <Share2 size={16} /> Share Recipe
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-20">
          
          {/* Visual Area */}
          <div>
              {isPlaying ? (
                <div className="relative aspect-square w-full rounded-lg overflow-hidden ring-4 ring-black/5">
                   {renderVideo()}
                   <button 
                      onClick={() => setIsPlaying(false)}
                      className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-black transition-colors"
                   >
                     Close Video
                   </button>
                </div>
              ) : (
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-gray-100">
                   <Image
                      src={bundle.thumbnail_url || "/images/placeholder-recipe.jpg"}
                      alt={bundle.name}
                      fill
                      className="object-cover"
                   />
                   
                   {bundle.video_url && (
                       <button 
                          onClick={() => setIsPlaying(true)}
                          className="absolute inset-0 flex items-center justify-center bg-black/20 group hover:bg-black/40 transition-all font-proxima"
                       >
                          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                             <div className="w-14 h-14 rounded-full bg-[#F0800F] shadow-xl flex items-center justify-center text-white">
                                <Play size={24} className="fill-current ml-1" />
                             </div>
                          </div>
                          <span className="absolute bottom-10 text-white font-black uppercase tracking-widest text-sm drop-shadow-md">Watch Masterclass</span>
                       </button>
                   )}
                </div>
              )}
          </div>

          {/* Content Area */}
          <div className="flex flex-col">
              <div className="mb-8">
                 {bundle.products && bundle.products.length > 0 ? (
                   <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-[#1B6013] rounded-lg text-[10px] font-black uppercase tracking-widest">
                     Ready to Cook Bundle
                   </span>
                 ) : (
                   <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-[#F0800F] rounded-lg text-[10px] font-black uppercase tracking-widest">
                     Custom Box
                   </span>
                 )}
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 uppercase tracking-tighter mb-6 leading-none">
                 {bundle.name}
              </h1>

              <div className="flex flex-wrap items-center gap-6 py-6 border-y border-gray-100 mb-8">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xl">
                       {(bundle.chef_name || "F")[0]}
                    </div>
                    <div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Cooked By</p>
                       <p className="font-bold text-slate-900 text-sm">{bundle.chef_name || "FeedMe Chef"}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 border-l pl-6 border-gray-100">
                    <Clock className="text-gray-400" size={20} />
                    <div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Prep Time</p>
                       <p className="font-bold text-gray-900 text-sm">25 MINS</p>
                    </div>
                 </div>
              </div>

              <div 
                 className="text-base text-gray-600 leading-relaxed mb-10 prose prose-sm prose-gray"
                 dangerouslySetInnerHTML={{ __html: bundle.description || "" }} 
              />

              <div className="p-6 bg-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-gray-100 shadow-sm">
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Bundle Price</p>
                   <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">
                         {formatNaira(finalTotal)}
                      </span>
                      {savings > 0 && (
                        <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                           Save {formatNaira(savings)}
                        </span>
                      )}
                   </div>
                </div>
                
                <div className="w-full sm:w-auto">
                   <button 
                      onClick={handleAddCustomBox}
                      className="w-full h-14 px-8 bg-[#1B6013] text-white rounded-lg font-black uppercase tracking-widest hover:bg-[#154d0f] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                   >
                      Add Custom Box
                   </button>
                   <p className="text-[10px] text-center mt-3 text-gray-400 font-medium">
                      All ingredients pre-portioned for 2 people
                   </p>
                </div>
              </div>
          </div>
        </div>

        {/* --- INGREDIENTS SHOPPING LIST (Mob Kitchen Style) --- */}
        <div className="pt-20 border-t border-gray-200">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                 <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">Build your box</h2>
                 <p className="text-slate-500 font-medium">Deselect items you already have at home.</p>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="px-4 py-2 bg-slate-100 rounded-full text-xs font-black uppercase tracking-widest text-slate-500">
                    {selectedIds.size} / {bundle.products?.length || 0} Items
                 </div>
                 <button 
                   onClick={() => setSelectedIds(new Set(bundle.products?.map((p: any) => p.id)))}
                   className="text-xs font-black uppercase tracking-widest text-[#F0800F] hover:text-[#d06d0a] underline decoration-2 underline-offset-4"
                 >
                   Select All
                 </button>
              </div>
           </div>

           {!bundle.products || bundle.products.length === 0 ? (
              <div className="p-16 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                 <ChefHat size={40} className="mx-auto text-slate-300 mb-6" />
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No ingredients found in this bundle.</p>
              </div>
           ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                 <div className="divide-y divide-slate-100">
                 {bundle.products.map((product: any) => {
                    const isSelected = selectedIds.has(product.id);
                    const selectedOption = selectedOptions[product.id];
                    const hasOptions = product.options && product.options.length > 0;

                    return (
                        <div 
                          key={product.id} 
                          className={`
                            group flex flex-col sm:flex-row sm:items-center gap-6 p-6 transition-colors
                            ${isSelected ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50 grayscale-[0.8] opacity-70'}
                          `}
                        >
                           {/* Checkbox Toggle */}
                           <button 
                             onClick={() => toggleProduct(product.id)}
                             className={`
                               flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
                               ${isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-transparent hover:border-slate-400'}
                             `}
                           >
                             {isSelected && <Check size={16} strokeWidth={3} />}
                           </button>

                           {/* Image */}
                           <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                              <Image 
                                 src={product.images?.[0] || "/images/placeholder-recipe.jpg"} 
                                 alt={product.name} 
                                 fill 
                                 className="object-cover mix-blend-multiply"
                              />
                           </div>
                           
                           {/* Details */}
                           <div className="flex-1 min-w-0">
                               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div>
                                     <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                                       {product.name}
                                     </h4>
                                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        {formatNaira(product.price)} / Unit
                                     </p>
                                  </div>

                                  {/* Options Selector or Price Display */}
                                  <div className="flex items-center gap-4">
                                    {hasOptions && isSelected ? (
                                      <div className="relative group/select min-w-[140px]">
                                        <select 
                                          className="appearance-none w-full text-xs font-bold text-slate-900 bg-white border-2 border-slate-200 pl-4 pr-10 py-3 rounded-lg outline-none cursor-pointer hover:border-[#F0800F] focus:border-[#F0800F] transition-colors"
                                          value={selectedOption?.name || ''}
                                          onChange={(e) => {
                                            const opt = product.options.find((o: any) => o.name === e.target.value);
                                            setProductOption(product.id, opt);
                                          }}
                                        >
                                          {product.options.map((opt: any) => (
                                            <option key={opt.name} value={opt.name}>
                                              {opt.name}
                                            </option>
                                          ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/select:text-[#F0800F]" />
                                      </div>
                                    ) : null}

                                    {/* Final Price for Item */}
                                    <div className="text-right min-w-[80px]">
                                       <span className={`text-xl font-black ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                                          {formatNaira(selectedOption?.price || product.price)}
                                       </span>
                                    </div>
                                  </div>
                               </div>
                           </div>
                        </div>
                    );
                 })}
                 </div>
                 
                 {/* Summary Footer in Box */}
                 <div className="bg-slate-50 p-6 sm:px-10 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Selected Total</p>
                       <p className="text-3xl font-black text-slate-900">{formatNaira(ingredientsSum)}</p>
                    </div>
                    
                    <button 
                      onClick={handleAddCustomBox}
                      className="w-full sm:w-auto h-14 px-8 bg-[#F0800F] text-white rounded-xl font-black uppercase tracking-widest hover:bg-[#d06d0a] transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                       Add {selectedIds.size} Items to Cart
                    </button>
                 </div>
              </div>
           )}
        </div>

        {/* Social Features Section - Clean & Minimal */}
        <div className="mt-20 space-y-16">
           {/* Bookmark & Share Actions */}
           <div className="flex items-center justify-center gap-4 py-8 border-y border-gray-100">
              <BookmarkButton bundleId={bundle.id} />
              <button 
                 onClick={handleShare}
                 className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-bold text-sm text-gray-900"
              >
                 <Share2 size={18} />
                 Share Recipe
              </button>
           </div>

           {/* Rating & Reviews Section */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                 <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">
                    Rate This Recipe
                 </h2>
                 <div className="bg-white rounded-lg border border-gray-100 p-6">
                    <RatingForm 
                       bundleId={bundle.id}
                       onRatingSubmit={() => {
                          showToast("Thank you for rating!", "success");
                       }}
                    />
                 </div>
              </div>

              <div>
                 <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">
                    Recipe Stats
                 </h2>
                 <div className="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                       <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Average Rating</span>
                       <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-gray-900">
                             {bundle.avg_rating ? bundle.avg_rating.toFixed(1) : "N/A"}
                          </span>
                          <span className="text-sm text-gray-400">/ 5.0</span>
                       </div>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                       <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Ratings</span>
                       <span className="text-2xl font-black text-gray-900">{bundle.rating_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                       <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Views</span>
                       <span className="text-2xl font-black text-gray-900">{bundle.view_count || 0}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* User Photos Gallery */}
           <div>
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                    Community Creations
                 </h2>
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    See what others made
                 </span>
              </div>
              <UserPhotosGallery 
                  bundleId={bundle.id} 
                  onUploadClick={() => setIsPhotoModalOpen(true)}
               />
           </div>

           {/* Photo Upload Modal */}
           <PhotoUploadModal
              bundleId={bundle.id}
              isOpen={isPhotoModalOpen}
              onClose={() => setIsPhotoModalOpen(false)}
           />

           {/* Comments Section */}
           <div>
              <CommentSection bundleId={bundle.id} />
           </div>
        </div>
      </Container>
    </div>
  );
}
