"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BlogHero() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/blog/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <section className="relative bg-[#FAFAF9] py-12 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-[#1B6013]/5 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-[#F2C94C]/10 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block mb-4 text-[#1B6013] font-bold tracking-[0.2em] text-xs uppercase font-proxima">
            FeedMe Blog
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-[#1D2939] tracking-tight font-proxima">
            Stories & Recipes
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-lg mx-auto leading-relaxed font-proxima">
            Fresh ideas, cooking tips, and updates for your daily life.
          </p>
          
          {/* Minimalist Search Bar */}
          <form onSubmit={handleSearch} className="max-w-lg mx-auto relative group">
            <div 
              className={`relative flex items-center transition-all duration-300 ${
                isFocused 
                  ? "bg-white shadow-lg scale-105" 
                  : "bg-white/80 shadow-sm hover:shadow-md"
              } rounded-full border border-gray-200`}
            >
              <div className="pl-6 text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search for recipes, stories..."
                className="w-full px-4 py-4 bg-transparent border-none text-gray-900 placeholder-gray-400 text-base"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#1B6013] text-white p-2.5 rounded-full hover:bg-[#15490e] transition-colors"
              >
                <Search size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}