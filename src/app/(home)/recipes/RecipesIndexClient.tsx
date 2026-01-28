"use client";

import React from "react";
import Container from "@components/shared/Container";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import RecipeCard from "@components/shared/recipes/RecipeCard";
import RecipeFilters from "@components/shared/recipes/RecipeFilters";
import { ChefHat, Search, Sparkles, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatNaira, toSlug } from "src/lib/utils";
import { motion } from "framer-motion";

interface RecipesIndexClientProps {
  recipes: any[];
  error: any;
}

export default function RecipesIndexClient({ recipes, error }: RecipesIndexClientProps) {
  const featuredRecipe = recipes[0];
  const remainingRecipes = recipes.slice(1);

  return (
    <div className="w-full bg-white selection:bg-[#1B6013] selection:text-white font-custom">
      {/* 
          --- CLEAN MINIMAL HERO --- 
      */}
      <section className="relative pt-32 pb-20 border-b border-gray-100">
        <Container>
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl"
              >
                 <div className="mb-6">
                    <CustomBreadcrumb />
                 </div>
                 <h1 className="text-5xl md:text-8xl font-black text-gray-950 leading-[0.95] tracking-tighter uppercase mb-8">
                    Master the <br /> Viral Plate.
                 </h1>
                 <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-lg">
                    Shop every viral trend in one click. Watch the masterclass, get the box, cook like a pro.
                 </p>
              </motion.div>

              {/* Search Bar Refined */}
              <div className="w-full md:w-96">
                 <div className="relative group">
                    <input 
                       type="text" 
                       placeholder="Find a masterclass..." 
                       className="w-full h-16 pl-12 pr-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#1B6013] focus:ring-4 focus:ring-[#1B6013]/5 transition-all outline-none font-bold"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1B6013] transition-colors" size={20} />
                 </div>
              </div>
           </div>
        </Container>
      </section>

      {/* 
          --- SIMPLE FEATURED SECTION --- 
      */}
      {featuredRecipe && (
        <section className="py-20">
           <Container>
              <Link href={`/recipes/${toSlug(featuredRecipe.name)}`} className="group block relative aspect-[21/9] rounded-[3rem] overflow-hidden bg-gray-100 shadow-2xl transition-transform hover:scale-[1.01] duration-700">
                 <Image 
                    src={featuredRecipe.social_image_url || featuredRecipe.thumbnail_url || "/images/placeholder-recipe.jpg"}
                    alt={featuredRecipe.name}
                    fill
                    className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                 
                 <div className="absolute bottom-12 left-12 right-12 text-white">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D9FF00] text-[#1B6013] font-black rounded-xl text-[10px] uppercase tracking-widest mb-6 shadow-xl">
                       <Sparkles size={12} /> Today&apos;s Feature
                    </div>
                    <h2 className="text-4xl md:text-7xl font-black leading-none uppercase tracking-tighter group-hover:text-[#D9FF00] transition-colors">
                       {featuredRecipe.name}
                    </h2>
                 </div>
                 
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white/20 backdrop-blur-3xl border border-white/20 flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-500">
                    <Play size={32} className="fill-current ml-1" />
                 </div>
              </Link>
           </Container>
        </section>
      )}

      {/* 
          --- CLEAN GRID FEED --- 
      */}
      <section className="py-20">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div>
               <h3 className="text-3xl font-black text-gray-950 uppercase tracking-tighter mb-2">The Library</h3>
               <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Fresh recipes added daily</p>
            </div>
            
            <RecipeFilters />
          </div>

          {error ? (
             <div className="p-20 text-center bg-gray-50 rounded-[3rem] border border-gray-100">
                <p className="text-gray-400 font-bold uppercase tracking-widest">Kitchen error. Please refresh.</p>
             </div>
          ) : !recipes || recipes.length === 0 ? (
            <div className="text-center py-40 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
               <ChefHat size={48} className="mx-auto text-gray-200 mb-6" />
               <h3 className="text-2xl font-black text-gray-950 uppercase tracking-tight">The Library is quiet</h3>
               <p className="text-gray-400 font-medium mt-2 max-w-xs mx-auto">We&apos;re stocking new ingredients. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
              {remainingRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* 
          --- SIMPLE NEWSLETTER --- 
      */}
      <section className="bg-gray-50 py-32">
         <Container>
            <div className="max-w-4xl mx-auto text-center">
               <h2 className="text-4xl md:text-6xl font-black text-gray-950 uppercase tracking-tighter mb-8">
                  Get the latest drops.
               </h2>
               <p className="text-xl text-gray-500 font-medium mb-12 max-w-lg mx-auto leading-relaxed">
                  Join 10k+ chefs who get early access to viral bundles and exclusive recipes.
               </p>
               
               <form className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                  <input 
                     type="email" 
                     placeholder="your@email.com" 
                     className="flex-1 h-16 px-6 rounded-2xl bg-white border border-gray-200 text-gray-950 font-bold focus:border-[#1B6013] outline-none transition-all shadow-sm"
                  />
                  <button className="h-16 px-10 bg-[#1B6013] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-green-100">
                     Join Now
                  </button>
               </form>
            </div>
         </Container>
      </section>
    </div>
  );
}
