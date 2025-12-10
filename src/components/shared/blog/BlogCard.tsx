"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, Heart, ArrowUpRight } from "lucide-react";
import { BlogPost } from "@/lib/actions/blog.actions";
import { formatDistanceToNow } from "date-fns";

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  // Determine height based on featured status
  const imageHeight = featured ? "h-[400px] md:h-[500px]" : "h-[280px]";

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="flex flex-col h-full bg-transparent">
        {/* Image Container */}
        <div className={`relative ${imageHeight} w-full overflow-hidden rounded-[20px] mb-6`}>
          {post.featured_image ? (
            <Image
              src={post.featured_image}
              alt={post.featured_image_alt || post.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-[#F2F4F7] flex items-center justify-center">
              <span className="text-4xl opacity-20 grayscale">🍽️</span>
            </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

          {/* Category Badge - Floating */}
          {post.blog_categories && (
            <div className="absolute top-4 left-4 z-10">
              <span 
                className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-white/90 backdrop-blur-md text-[#1B6013] shadow-sm"
              >
                {post.blog_categories.name}
              </span>
            </div>
          )}
          
          {/* Arrow Icon on Hover */}
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                <ArrowUpRight className="w-5 h-5 text-[#1B6013]" />
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow">
          {/* Meta Top */}
          <div className="flex items-center gap-3 text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
            {post.published_at && (
                <span>{new Date(post.published_at).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            )}
            {post.reading_time && (
                <>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{post.reading_time} min read</span>
                </>
            )}
          </div>

          {/* Title */}
          <h2 className={`font-serif font-bold text-[#1D2939] mb-3 leading-tight group-hover:text-[#1B6013] transition-colors ${
            featured ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
          }`}>
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className={`text-gray-600 mb-4 line-clamp-2 font-light leading-relaxed ${featured ? "text-lg" : "text-base"}`}>
              {post.excerpt}
            </p>
          )}

          {/* Footer Meta */}
          <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
             <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                    <Eye size={14} />
                    <span>{post.views_count.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Heart size={14} />
                    <span>{post.likes_count.toLocaleString()}</span>
                </div>
             </div>
             
             {/* Tags (First one only) */}
             {post.blog_post_tags && post.blog_post_tags.length > 0 && (
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                    #{post.blog_post_tags[0].blog_tags.name}
                </span>
             )}
          </div>
        </div>
      </article>
    </Link>
  );
}