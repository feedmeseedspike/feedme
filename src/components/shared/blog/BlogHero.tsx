"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BlogHero() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/blog/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <section className="bg-gradient-to-br from-[#1B6013] via-[#2B7A1F] to-[#3B8B2F] text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          FeedMe Blog
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
          Discover delicious recipes, food stories, cooking tips, and local cuisine culture
        </p>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search recipes, tips, and stories..."
              className="w-full px-6 py-4 pr-12 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Search size={20} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}