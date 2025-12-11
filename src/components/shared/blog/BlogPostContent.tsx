"use client";

import Image from "next/image";
import { Clock, Eye, Heart, Share2, User, ChefHat, Droplets, Flame } from "lucide-react";
import { BlogPost } from "@/lib/actions/blog.actions";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useUser } from "src/hooks/useUser";
import { useToast } from "src/hooks/useToast";
import ProductLinkParser from "./ProductLinkParser";

interface BlogPostContentProps {
  post: BlogPost;
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [viewsCount, setViewsCount] = useState(post.views_count);
  const { user } = useUser();
  const { showToast } = useToast();

  // State for guest ID
  const [guestId, setGuestId] = useState<string | null>(null);

  // Initialize guest ID on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let storedGuestId = localStorage.getItem('feedme_guest_like_id');
      if (!storedGuestId) {
        storedGuestId = crypto.randomUUID();
        localStorage.setItem('feedme_guest_like_id', storedGuestId);
      }
      setGuestId(storedGuestId);
    }
  }, []);



  // Initialize like state for logged-in user OR guest
  useEffect(() => {
    // Need at least one ID to check
    const idToCheck = user?.user_id || guestId;
    if (!idToCheck) return;

    const controller = new AbortController();
    
    // Build query string
    let query = `/api/blog/posts/${post.slug}/like?`;
    if (user?.user_id) query += `userId=${encodeURIComponent(user.user_id)}`;
    else if (guestId) query += `guestId=${encodeURIComponent(guestId)}`;

    fetch(query, {
        method: "GET",
        signal: controller.signal,
      })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.success) setIsLiked(!!data.liked);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [post.slug, user?.user_id, guestId]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying URL
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied to clipboard", "success");
  };

  const handleLike = async () => {
    const currentUserId = user?.user_id;
    const currentGuestId = guestId;

    if (!currentUserId && !currentGuestId) {
       // Should allow if guestId is generated, which happens on mount.
       // Only strictly block if something failed with guest ID gen.
       showToast("Unable to verify user session for liking", "error"); 
       return;
    }

    // Optimistic toggle
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => prev + (nextLiked ? 1 : -1));
    try {
      const body: any = {};
      if (currentUserId) body.userId = currentUserId;
      else body.guestId = currentGuestId;

      const res = await fetch(`/api/blog/posts/${post.slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      // Fetch updated post to get accurate likes_count from database
      const postRes = await fetch(`/api/blog/posts/${post.slug}`);
      if (postRes.ok) {
        const postData = await postRes.json();
        if (postData.success && postData.post) {
          setLikesCount(postData.post.likes_count);
        }
      }
    } catch (e) {
      // Revert on failure
      setIsLiked((was) => !was);
      setLikesCount((prev) => prev + (nextLiked ? -1 : 1));
      showToast("Failed to update like. Please try again.", "error");
    }
  };

  return (
    <article className="max-w-none font-proxima text-[#2A2A2A]">
      {/* Hero Header - Centered & Premium */}
      <header className="mb-16 md:mb-24 text-center max-w-4xl mx-auto px-4">
        {/* Category Badge - Minimalist */}
        {post.blog_categories && (
          <div className="mb-8">
            <span
              className="inline-block px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-[#1B6013] border border-[#1B6013]/20"
            >
              {post.blog_categories.name}
            </span>
          </div>
        )}

        {/* Title - Luxurious & Large */}
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-[1.1] tracking-tight text-[#1D2939]">
          {post.title}
        </h1>

        {/* Excerpt - Elegant Body Text */}
        {post.excerpt && (
          <p className="text-lg md:text-xl text-stone-500 mb-10 leading-relaxed max-w-2xl mx-auto font-light">
            {post.excerpt}
          </p>
        )}

        {/* Meta Info - Architectural Lines */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-medium tracking-widest uppercase text-stone-400 border-y border-[#E6E4DC] py-6 max-w-fit mx-auto px-12">
          {post.published_at && (
            <time dateTime={post.published_at}>
              {format(new Date(post.published_at), "MMMM d, yyyy")}
            </time>
          )}
          <span className="w-1 h-1 rounded-full bg-stone-300" />
          {post.reading_time && (
             <span>{post.reading_time} min read</span>
          )}
        </div>
      </header>

      {/* Featured Image - Cinematic Reveal */}
      {/* Featured Image - Premium Gallery Style */}
      {post.featured_image && (
        <div className="relative w-full h-[500px] mb-16 md:mb-24 rounded-2xl overflow-hidden shadow-sm bg-stone-100 group">
            {/* Blurred Backdrop - Fills space with ambiance */}
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center blur-2xl opacity-40 scale-110 transition-transform duration-[3s] hover:scale-125"
              style={{ backgroundImage: `url(${post.featured_image})` }}
            />
            
            {/* Sharp Foreground Image - Fully visible, "floating" feel */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
               <img
                  src={`${post.featured_image}?v=${Date.now()}`}
                  alt={post.featured_image_alt || post.title}
                  className="w-auto h-full max-h-full object-contain drop-shadow-2xl rounded-sm transform transition-transform duration-700 group-hover:scale-[1.02]"
                />
            </div>
        </div>
      )}

      <div className="max-w-[680px] mx-auto relative px-4 md:px-0">
        
        {/* Sticky Actions Bar (Desktop) */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-stone-100 rounded-full px-6 py-3 flex items-center gap-6 md:absolute md:top-0 md:-left-24 md:h-fit md:flex-col md:bg-transparent md:shadow-none md:border-none md:backdrop-blur-none md:translate-x-0 md:translate-y-0">
           
           <button
             onClick={handleLike}
             className={`flex flex-col items-center gap-1 group transition-all duration-300 ${isLiked ? 'text-red-500' : 'text-stone-400 hover:text-stone-800'}`}
             title="Like this post"
           >
             <div className={`p-2 rounded-full transition-all ${isLiked ? 'bg-red-50' : 'bg-transparent group-hover:bg-stone-100'}`}>
                <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
             </div>
             <span className="text-[10px] font-bold">{likesCount}</span>
           </button>

           <div className="w-[1px] h-8 bg-stone-200 hidden md:block" />

           <button
             onClick={handleShare}
             className="flex flex-col items-center gap-1 group text-stone-400 hover:text-stone-800 transition-all duration-300"
             title="Share"
           >
             <div className="p-2 rounded-full bg-transparent group-hover:bg-stone-100">
                <Share2 size={20} />
             </div>
             <span className="text-[10px] font-bold hidden md:block">Share</span>
           </button>
        </div>

        {/* Recipe Info - Minimalist Card */}
        {(post.prep_time || post.cook_time || post.servings) && (
            <div className="bg-[#FAF9F6] p-8 mb-16 border-l-2 border-[#1B6013]">
              <div className="flex items-center gap-3 mb-8">
                  <ChefHat size={20} className="text-[#1B6013]" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900">Recipe Essentials</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
                  {post.prep_time && (
                  <div>
                      <div className="text-stone-400 text-[10px] uppercase tracking-widest mb-1">Prep</div>
                      <div className="text-xl font-bold text-stone-800">{post.prep_time}m</div>
                  </div>
                  )}
                  {post.cook_time && (
                  <div>
                      <div className="text-stone-400 text-[10px] uppercase tracking-widest mb-1">Cook</div>
                      <div className="text-xl font-bold text-stone-800">{post.cook_time}m</div>
                  </div>
                  )}
                  {post.servings && (
                  <div>
                      <div className="text-stone-400 text-[10px] uppercase tracking-widest mb-1">Serves</div>
                      <div className="text-xl font-bold text-stone-800">{post.servings}</div>
                  </div>
                  )}
                  {post.difficulty && (
                  <div>
                      <div className="text-stone-400 text-[10px] uppercase tracking-widest mb-1">Level</div>
                      <div className="text-xl font-bold text-[#1B6013] capitalize">{post.difficulty}</div>
                  </div>
                  )}
              </div>
            </div>
        )}

        {/* Ingredients - Clean List */}
        {post.ingredients &&
            Array.isArray(post.ingredients) &&
            post.ingredients.length > 0 && (
            <div className="mb-16">
                <h3 className="text-2xl font-bold text-[#1D2939] mb-8">Ingredients</h3>
                <ul className="grid grid-cols-1 gap-4">
                {post.ingredients.map((ingredient: any, index: number) => (
                    <li key={index} className="flex items-baseline gap-4 group">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4C5B9] mt-2 group-hover:bg-[#1B6013] transition-colors" />
                      <span className="text-lg text-stone-600 font-light leading-relaxed border-b border-stone-100 pb-4 flex-1 group-hover:text-stone-900 transition-colors">
                          {typeof ingredient === "string"
                          ? ingredient
                          : <><span className="font-semibold text-stone-800">{ingredient.quantity}</span> {ingredient.name || ingredient}</>}
                      </span>
                    </li>
                ))}
                </ul>
            </div>
            )}

        {/* Main Content - Typography Focused */}
        <div className="prose prose-lg prose-stone max-w-none mb-16 prose-p:font-proxima prose-p:font-light prose-p:leading-[2] prose-p:text-stone-600 prose-headings:font-bold prose-headings:text-[#1D2939] prose-img:rounded-none prose-img:shadow-lg prose-a:text-[#1B6013] prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-[#1B6013] prose-blockquote:bg-[#FAF9F6] prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:font-normal">
            <ProductLinkParser content={post.content} />
        </div>

        {/* Instructions - Numbered Steps */}
        {post.instructions &&
            Array.isArray(post.instructions) &&
            post.instructions.length > 0 && (
            <div className="mb-20">
                <h3 className="text-2xl font-bold text-[#1D2939] mb-10">Method</h3>
                <div className="space-y-12">
                {post.instructions.map((instruction: any, index: number) => (
                    <div key={index} className="flex gap-6 group">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-xs font-bold text-stone-400 border border-stone-200 rounded-full group-hover:border-[#1B6013] group-hover:text-[#1B6013] transition-colors mt-1">
                          {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1">
                          <p className="text-lg text-stone-700 leading-relaxed font-light">
                          {typeof instruction === "string"
                              ? instruction
                              : instruction.text || instruction}
                          </p>
                      </div>
                    </div>
                ))}
                </div>
            </div>
            )}

        {/* Tags - Minimalist Pills */}
        {post.blog_post_tags && post.blog_post_tags.length > 0 && (
            <div className="pt-10 border-t border-stone-200 mb-12">
            <div className="flex flex-wrap gap-2">
                {post.blog_post_tags.map((tagRel) => (
                <span
                    key={tagRel.blog_tags.id}
                    className="inline-block px-3 py-1 bg-stone-100 text-stone-500 text-xs font-bold uppercase tracking-wider hover:bg-[#1B6013] hover:text-white transition-all duration-300 cursor-pointer"
                >
                    {tagRel.blog_tags.name}
                </span>
                ))}
            </div>
            </div>
        )}

      </div>
    </article>
  );
}
