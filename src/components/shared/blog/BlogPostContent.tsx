"use client";

import Image from "next/image";
import { Clock, Eye, Heart, Share2, User, ChefHat, Users } from "lucide-react";
import { BlogPost } from "@/lib/actions/blog.actions";
import { formatDistanceToNow, format } from "date-fns";
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

  // Increment views (once per device per day) and update UI count optimistically
  useEffect(() => {
    const key = `blog_viewed_${post.slug}`;
    const today = new Date().toISOString().slice(0, 10);
    const last =
      typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (last !== today) {
      fetch(`/api/blog/posts/${post.slug}/views`, { method: "POST" })
        .then(() => {
          try {
            localStorage.setItem(key, today);
          } catch {}
          setViewsCount((v) => v + 1);
        })
        .catch(() => {});
    }
  }, [post.slug]);

  // Initialize like state for logged-in user
  useEffect(() => {
    if (!user?.user_id) return;
    const controller = new AbortController();
    fetch(
      `/api/blog/posts/${post.slug}/like?userId=${encodeURIComponent(user.user_id)}`,
      {
        method: "GET",
        signal: controller.signal,
      }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.success) setIsLiked(!!data.liked);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [post.slug, user?.user_id]);

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
    // You could show a toast notification here
  };

  const handleLike = async () => {
    if (!user?.user_id) {
      showToast("Please log in to like this post", "info");
      return;
    }
    // Optimistic toggle
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => prev + (nextLiked ? 1 : -1));
    try {
      const res = await fetch(`/api/blog/posts/${post.slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.user_id }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch (e) {
      // Revert on failure
      setIsLiked((was) => !was);
      setLikesCount((prev) => prev + (nextLiked ? -1 : 1));
      showToast("Failed to update like. Please try again.", "error");
    }
  };

  return (
    <article className="max-w-none">
      {/* Header */}
      <header className="mb-8">
        {/* Category Badge */}
        {post.blog_categories && (
          <div className="mb-4">
            <span
              className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: post.blog_categories.color }}
            >
              {post.blog_categories.name}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-2">
            <User size={16} />
            <span>FeedMe Team</span>
          </div>
          {post.published_at && (
            <time dateTime={post.published_at}>
              {format(new Date(post.published_at), "MMMM d, yyyy")}
            </time>
          )}
          {post.reading_time && (
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>{post.reading_time} min read</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Eye size={16} />
            <span>{viewsCount.toLocaleString()} views</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
              isLiked
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="relative h-96 md:h-[500px] mb-8 rounded-xl overflow-hidden">
          <Image
            src={`${post.featured_image}?v=${Date.now()}`}
            alt={post.featured_image_alt || post.title}
            fill
            className="object-cover"
            unoptimized={true} // Disable Next.js image optimization caching
          />
        </div>
      )}

      {/* Recipe Info (if applicable) */}
      {(post.prep_time || post.cook_time || post.servings) && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="text-[#1B6013]" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Recipe Info</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {post.prep_time && (
              <div className="text-center">
                <div className="text-2xl font-bold text-[#F0800F]">
                  {post.prep_time}min
                </div>
                <div className="text-sm text-gray-600">Prep Time</div>
              </div>
            )}
            {post.cook_time && (
              <div className="text-center">
                <div className="text-2xl font-bold text-[#F0800F]">
                  {post.cook_time}min
                </div>
                <div className="text-sm text-gray-600">Cook Time</div>
              </div>
            )}
            {post.servings && (
              <div className="text-center">
                <div className="text-2xl font-bold text-[#F0800F]">
                  {post.servings}
                </div>
                <div className="text-sm text-gray-600">Servings</div>
              </div>
            )}
            {post.difficulty && (
              <div className="text-center">
                <div
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    post.difficulty === "easy"
                      ? "bg-green-100 text-green-800"
                      : post.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {post.difficulty.charAt(0).toUpperCase() +
                    post.difficulty.slice(1)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Difficulty</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingredients (if it's a recipe) */}
      {post.ingredients &&
        Array.isArray(post.ingredients) &&
        post.ingredients.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Ingredients
            </h3>
            <ul className="space-y-2">
              {post.ingredients.map((ingredient: any, index: number) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#1B6013] rounded-full flex-shrink-0" />
                  <span className="text-gray-700">
                    {typeof ingredient === "string"
                      ? ingredient
                      : `${ingredient.quantity || ""} ${ingredient.name || ingredient}`.trim()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Main Content */}
      <ProductLinkParser content={post.content} />

      {/* Instructions (if it's a recipe) */}
      {post.instructions &&
        Array.isArray(post.instructions) &&
        post.instructions.length > 0 && (
          <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Instructions
            </h3>
            <ol className="space-y-4">
              {post.instructions.map((instruction: any, index: number) => (
                <li key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#1B6013] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 leading-relaxed">
                      {typeof instruction === "string"
                        ? instruction
                        : instruction.text || instruction}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

      {/* Tags */}
      {post.blog_post_tags && post.blog_post_tags.length > 0 && (
        <div className="mt-8 pt-8 border-t">
          <h4 className="text-sm font-medium text-gray-500 mb-3">TAGS</h4>
          <div className="flex flex-wrap gap-2">
            {post.blog_post_tags.map((tagRel) => (
              <span
                key={tagRel.blog_tags.id}
                className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
              >
                #{tagRel.blog_tags.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
