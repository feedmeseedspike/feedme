"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, ChefHat, Timer } from "lucide-react";
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
        className="group flex flex-col"
    >
      <Link href={recipeUrl} className="relative block aspect-square overflow-hidden rounded-3xl bg-gray-50 mb-6">
        <Image
          src={recipe.social_image_url || recipe.thumbnail_url || "/images/placeholder-recipe.jpg"}
          alt={recipe.name || "Recipe"}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Simple Play Icon on Hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#1B6013] shadow-xl">
               <Play size={20} className="fill-current ml-1" />
            </div>
        </div>
      </Link>
      
      <div className="space-y-3">
         <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#1B6013] transition-colors line-clamp-1">
               {recipe.name}
            </h3>
            <span className="font-black text-[#1B6013] whitespace-nowrap">
               {formatNaira(recipe.price || 0)}
            </span>
         </div>
         
         <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
               <Timer size={14} className="text-gray-400" /> 15 MINS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
            <span className="flex items-center gap-1.5">
               <ChefHat size={14} className="text-gray-400" /> BY {recipe.chef_name?.toUpperCase() || "FEEDME"}
            </span>
         </div>
      </div>
    </motion.div>
  );
}
