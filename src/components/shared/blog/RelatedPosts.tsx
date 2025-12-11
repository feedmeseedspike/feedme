"use client";

import { useEffect, useState } from "react";
import { BlogPost } from "@/lib/actions/blog.actions";
import BlogCard from "./BlogCard";
import { Skeleton } from "@components/ui/skeleton";

interface RelatedPostsProps {
  slug: string;
}

export default function RelatedPosts({ slug }: RelatedPostsProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedPosts() {
      try {
        const response = await fetch(`/api/blog/posts/${slug}/related?limit=3`);
        const data = await response.json();
        
        if (data.success) {
          setPosts(data.posts);
        }
      } catch (error) {
        console.error("Error fetching related posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRelatedPosts();
  }, [slug]);

  if (loading) {
    return (
      <section className="border-t border-gray-100 pt-16">
        <h2 className="text-3xl font-serif font-bold text-[#1D2939] mb-10">More to Explore</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-[280px] w-full rounded-[20px]" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-gray-100 pt-16">
      <h2 className="text-3xl font-serif font-bold text-[#1D2939] mb-10">More to Explore</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}