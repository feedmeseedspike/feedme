"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, Heart, User } from "lucide-react";
import { BlogPost } from "@/lib/actions/blog.actions";
import { formatDistanceToNow } from "date-fns";

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const cardClasses = featured 
    ? "group cursor-pointer bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
    : "group cursor-pointer bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden";

  const imageHeight = featured ? "h-64" : "h-48";

  return (
    <Link href={`/blog/${post.slug}`}>
      <article className={cardClasses}>
        {/* Featured Image */}
        <div className={`relative ${imageHeight} overflow-hidden`}>
          {post.featured_image ? (
            <Image
              src={post.featured_image}
              alt={post.featured_image_alt || post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-[#F0800F]/20 flex items-center justify-center">
              <span className="text-6xl opacity-20">🍽️</span>
            </div>
          )}
          
          {/* Category Badge */}
          {post.blog_categories && (
            <div className="absolute top-4 left-4">
              <span 
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: post.blog_categories.color }}
              >
                {post.blog_categories.name}
              </span>
            </div>
          )}

          {/* Featured Badge */}
          {post.featured && (
            <div className="absolute top-4 right-4">
              <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                ⭐ Featured
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tags */}
          {post.blog_post_tags && post.blog_post_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.blog_post_tags.slice(0, 3).map((tagRel) => (
                <span
                  key={tagRel.blog_tags.id}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                >
                  #{tagRel.blog_tags.name}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 className={`font-bold text-gray-900 mb-3 group-hover:text-[#F0800F] transition-colors ${
            featured ? "text-xl md:text-2xl" : "text-lg"
          }`}>
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-gray-600 mb-4 line-clamp-2">
              {post.excerpt}
            </p>
          )}

          {/* Recipe Info (if it's a recipe) */}
          {post.prep_time && post.cook_time && (
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>Prep: {post.prep_time}min</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>Cook: {post.cook_time}min</span>
              </div>
              {post.difficulty && (
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    post.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    post.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {post.difficulty}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye size={16} />
                <span>{post.views_count.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart size={16} />
                <span>{post.likes_count.toLocaleString()}</span>
              </div>
              {post.reading_time && (
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{post.reading_time} min read</span>
                </div>
              )}
            </div>
            
            <div className="text-xs">
              {post.published_at && formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}