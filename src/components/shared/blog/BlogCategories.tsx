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
      <div className="flex gap-4 mb-12 overflow-x-auto pb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-32 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {/* All Categories */}
        <Link
          href="/blog"
          className={`px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-300 ${
            !selectedCategory
              ? "bg-[#1B6013] text-white shadow-md transform scale-105"
              : "bg-white text-gray-600 border border-gray-100 hover:border-[#1B6013]/30 hover:text-[#1B6013] hover:shadow-sm"
          }`}
        >
          All Stories
        </Link>
        
        {/* Category Buttons */}
        {categories.map((category) => {
          const isSelected = selectedCategory === category.slug;
          
          return (
            <Link
              key={category.id}
              href={`/blog?category=${category.slug}`}
              className={`px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                isSelected
                  ? "text-white shadow-md transform scale-105"
                  : "bg-white text-gray-600 border border-gray-100 hover:border-[#1B6013]/30 hover:text-[#1B6013] hover:shadow-sm"
              }`}
              style={isSelected ? { backgroundColor: category.color || '#1B6013' } : {}}
            >
              {category.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}