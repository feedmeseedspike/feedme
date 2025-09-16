"use client";

import { useEffect, useState } from "react";
import { BlogPost } from "@/lib/actions/blog.actions";
import BlogCard from "./BlogCard";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";

interface BlogSearchResultsProps {
  query: string;
  page: number;
}

export default function BlogSearchResults({
  query,
  page,
}: BlogSearchResultsProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setPosts([]);
      return;
    }

    async function searchPosts() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/blog/search?q=${encodeURIComponent(query)}&limit=10`
        );
        const data = await response.json();

        if (data.success) {
          setPosts(data.posts);
        }
      } catch (error) {
        console.error("Error searching posts:", error);
      } finally {
        setLoading(false);
      }
    }

    searchPosts();
  }, [query]);

  if (!query) {
    return (
      <div className="text-center py-12">
        <Search size={48} className="text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Start Your Search
        </h3>
        <p className="text-gray-500 mb-6">
          Enter a search term to find recipes, cooking tips, and food stories.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[#F0800F] hover:text-[#1B6013] font-medium"
        >
          <ArrowLeft size={16} />
          Back to Blog
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            <div className="flex gap-4">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <Search size={48} className="text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Results Found
        </h3>
        <p className="text-gray-500 mb-6">
          We couldn&apos;t find any posts matching &quot;{query}&quot;. Try
          different keywords or browse our categories.
        </p>
        <div className="space-y-3">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[#F0800F] hover:text-[#1B6013] font-medium mr-6"
          >
            <ArrowLeft size={16} />
            Back to Blog
          </Link>
          <Link
            href="/blog?category=recipes"
            className="text-[#F0800F] hover:text-[#1B6013] font-medium"
          >
            Browse Recipes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-gray-600">
          Found {posts.length} result{posts.length !== 1 ? "s" : ""} for &quot;
          {query}&quot;
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[#F0800F] hover:text-[#1B6013] font-medium"
        >
          <ArrowLeft size={16} />
          Back to Blog
        </Link>
      </div>
    </div>
  );
}
