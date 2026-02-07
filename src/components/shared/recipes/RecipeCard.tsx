"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, ChefHat, Timer, ArrowUpRight } from "lucide-react";
import { formatNaira, toSlug } from "src/lib/utils";
import { motion } from "framer-motion";

interface RecipeCardProps {
  recipe: any;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const slug = toSlug(recipe.name || "");
  const recipeUrl = `/recipes/${slug}`;

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="group flex flex-col h-full bg-transparent"
    >
      <Link href={recipeUrl} className="relative block aspect-square overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={recipe.social_image_url || recipe.thumbnail_url || "/images/placeholder-recipe.jpg"}
          alt={recipe.name || "Recipe"}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Minimal Price Tag */}
        <div className="absolute bottom-3 right-3 px-3 py-1 bg-white rounded-md shadow-sm">
           <span className="text-sm font-bold text-gray-900">
              {formatNaira(recipe.price || 0)}
           </span>
        </div>
      </Link>
      
      <div className="pt-5 flex flex-col flex-1">
         <div className="flex-1 space-y-2">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#F0800F] transition-colors leading-tight uppercase tracking-tight">
               <Link href={recipeUrl}>
                  {recipe.name}
               </Link>
            </h3>
            
            <p className="text-sm text-gray-500 line-clamp-2 font-medium leading-relaxed">
               Get the exact box and master the viral plate in under 15 minutes.
            </p>
         </div>
         
         <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs font-bold font-sans tracking-widest text-gray-400 uppercase">
             <span className="text-[#F0800F]">15 MINS</span>
             <span className="text-gray-300">•</span>
             <span>{recipe.chef_name?.split(' ')[0] || "FeedMe"}</span>
         </div>
      </div>
    </motion.div>
  );
}
