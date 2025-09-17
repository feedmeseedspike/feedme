"use client";

import { useEffect, useState } from "react";
import { BlogPost } from "@/lib/actions/blog.actions";
import BlogCard from "./BlogCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface BlogGridProps {
  category?: string;
  page: number;
}

const POSTS_PER_PAGE = 9;

export default function BlogGrid({ category, page }: BlogGridProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const offset = (page - 1) * POSTS_PER_PAGE;
        const url = new URL("/api/blog/posts", window.location.origin);
        url.searchParams.set("limit", (POSTS_PER_PAGE + 1).toString()); // Fetch one extra to check if there's a next page
        url.searchParams.set("offset", offset.toString());
        
        if (category) {
          url.searchParams.set("category", category);
        }

        const response = await fetch(url.toString());
        const data = await response.json();
        
        if (data.success) {
          const fetchedPosts = data.posts;
          setHasNextPage(fetchedPosts.length > POSTS_PER_PAGE);
          setPosts(fetchedPosts.slice(0, POSTS_PER_PAGE)); // Remove the extra post
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [category, page]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {category ? `${category} Posts` : "Latest Posts"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const createPageUrl = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }
    return `/blog?${params.toString()}`;
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Posts` : "Latest Posts"}
        </h2>
        <div className="text-sm text-gray-500">
          Page {page}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts found</h3>
          <p className="text-gray-500">
            {category ? `No posts found in the ${category} category.` : "No blog posts available yet."}
          </p>
          {category && (
            <Link 
              href="/blog" 
              className="inline-block mt-4 text-[#F0800F] hover:text-[#1B6013] font-medium"
            >
              View all posts →
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          {(page > 1 || hasNextPage) && (
            <div className="flex justify-center items-center gap-4">
              {page > 1 && (
                <Link
                  href={createPageUrl(page - 1)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                  Previous
                </Link>
              )}
              
              <span className="px-4 py-2 bg-[#1B6013] text-white rounded-lg">
                {page}
              </span>
              
              {hasNextPage && (
                <Link
                  href={createPageUrl(page + 1)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Next
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}