"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BlogCategory } from "@/lib/actions/blog.actions";

interface BlogCategoriesProps {
  selectedCategory?: string;
}

export default function BlogCategories({ selectedCategory }: BlogCategoriesProps) {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/blog/categories");
        const data = await response.json();
        
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-32 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* All Categories */}
        <Link
          href="/blog"
          className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
            !selectedCategory
              ? "bg-[#1B6013] text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          All Posts
        </Link>
        
        {/* Category Buttons */}
        {categories.map((category) => {
          const isSelected = selectedCategory === category.slug;
          
          return (
            <Link
              key={category.id}
              href={`/blog?category=${category.slug}`}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                isSelected
                  ? "text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
              style={isSelected ? { backgroundColor: category.color } : {}}
            >
              {category.icon && (
                <span className="w-4 h-4">
                  {/* You can replace this with actual icons */}
                  <div 
                    className="w-4 h-4 rounded-full opacity-75" 
                    style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : category.color }}
                  />
                </span>
              )}
              {category.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}