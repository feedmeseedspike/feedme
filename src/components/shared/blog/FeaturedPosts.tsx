"use client";

import { useEffect, useState } from "react";
import { BlogPost } from "@/lib/actions/blog.actions";
import BlogCard from "./BlogCard";
import { Skeleton } from "@components/ui/skeleton";

export default function FeaturedPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedPosts() {
      try {
        const response = await fetch("/api/blog/featured?limit=3");
        const data = await response.json();
        
        if (data.success) {
          setPosts(data.posts);
        }
      } catch (error) {
        console.error("Error fetching featured posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedPosts();
  }, []);

  if (loading) {
    return (
      <div className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
                <Skeleton className="h-[500px] w-full rounded-[20px]" />
                <Skeleton className="h-8 w-3/4 mt-6" />
                <Skeleton className="h-4 w-full mt-3" />
            </div>
            <div className="lg:col-span-4 flex flex-col gap-8">
                <Skeleton className="h-[240px] w-full rounded-[20px]" />
                <Skeleton className="h-[240px] w-full rounded-[20px]" />
            </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  // Split posts into Hero (first one) and Side (rest)
  const heroPost = posts[0];
  const sidePosts = posts.slice(1);

  return (
    <section className="mb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Hero Post - Takes up 8 columns */}
        <div className="lg:col-span-8">
            <BlogCard post={heroPost} featured={true} />
        </div>

        {/* Side Posts - Takes up 4 columns */}
        <div className="lg:col-span-4 flex flex-col gap-10">
            {sidePosts.map((post) => (
                <div key={post.id} className="flex-1">
                    <BlogCard post={post} featured={false} />
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}