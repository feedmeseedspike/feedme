"use client";

import React from "react";
import Container from "@components/shared/Container";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import RecipeCard from "@components/shared/recipes/RecipeCard";
import RecipeFilters from "@components/shared/recipes/RecipeFilters";
import { Search, ArrowRight, Play, Utensils } from "lucide-react";
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
    <div className="w-full bg-white min-h-screen font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
      
      {/* --- HERO SECTION (Clean Editorial) --- */}
      <section className="relative w-full pt-20 pb-24 border-b border-gray-100">
         <Container>
            <div className="flex flex-col items-center text-center space-y-8">
               
               {/* Label */}
               <div className="inline-block">
                  <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400 border border-slate-200 px-3 py-1.5 rounded-full">
                     The FeedMe Kitchen
                  </span>
               </div>
               
               {/* Heading - Proxima (Sans) */}
               <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter uppercase text-slate-900">
                  COOK <br />
                  LIKE A <span className="text-[#F0800F]">CHEF.</span>
               </h1>
               
               <p className="text-lg md:text-xl text-slate-500 font-medium max-w-xl leading-relaxed">
                  Real chef recipes. Exact ingredients delivered. <br/>
                  Master the viral plate in 15 minutes.
               </p>

               {/* Search Interface */}
               <div className="w-full max-w-2xl mt-12 relative group">
                  <input 
                     type="text" 
                     placeholder="Search for 'Pasta'..." 
                     className="w-full h-16 bg-white border-b-2 border-gray-100 text-2xl font-bold text-slate-900 placeholder:text-gray-300 focus:outline-none focus:border-[#F0800F] transition-all px-4"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#F0800F] transition-colors" size={24} />
               </div>
            </div>
         </Container>
      </section>


      {/* --- FILTER & FEED --- */}
      <section className="py-16">
         <Container>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-gray-100">
               <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">Fresh Drops</h2>
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">New recipes added every Tuesday</p>
               </div>
               <div className="w-full md:w-auto">
                 <RecipeFilters />
               </div>
            </div>

            {error ? (
              <div className="py-32 text-center">
                 <p className="text-slate-400 font-bold text-xl">The kitchen is quiet right now.</p>
              </div>
            ) : !recipes || recipes.length === 0 ? (
               <div className="py-32 text-center border border-dashed border-gray-200 rounded-lg">
                  <p className="text-slate-400 font-bold text-xl">No recipes found matching your taste.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                  {recipes.map((recipe) => (
                     <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
               </div>
            )}
         </Container>
      </section>

    </div>
  );
}
