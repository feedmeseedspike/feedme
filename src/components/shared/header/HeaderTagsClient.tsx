"use client";

import Link from "next/link";
import React from "react";
import FlyoutLink from "@components/shared/header/FlyoutLink";
import { ChevronDownIcon, Menu } from "lucide-react";
import { toSlug } from "src/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";

type CategoryListItem = {
  id: string;
  title: string;
  thumbnail: any; 
};

type Product = {
  id: string;
  name: string;
};

// Cool color palette for categories
const CATEGORY_COLORS = [
  "bg-[#ff6600]/30",
  "bg-[#00b894]/30",
  "bg-[#0984e3]/30",
  "bg-[#fdcb6e]/30",
  "bg-[#6c5ce7]/30",
  "bg-[#e17055]/30",
  "bg-[#00cec9]/30",
  "bg-[#fab1a0]/30",
  "bg-[#636e72]/30",
  "bg-[#fd79a8]/30",
  "bg-[#81ecec]/30",
  "bg-[#ffeaa7]/30",
];

function getCategoryColor(categoryId: string, colors: string[]) {
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    hash = categoryId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface HeaderTagsClientProps {
  categories: CategoryListItem[];
  productsByCategory: Record<string, Product[]>;
  error: string | null;
}

const HeaderTagsClient = ({ categories, productsByCategory, error }: HeaderTagsClientProps) => {
  return (
    <FlyoutLink
      FlyoutContent={() => (
        <motion.div 
          className="p-3 w-full mx-auto overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {error && (
            <motion.div 
              className="p-3 text-red-500 bg-red-50 rounded-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {error}
            </motion.div>
          )}
          {!error && categories.length === 0 && (
            <motion.div 
              className="text-gray-500 text-center py-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              No categories found.
            </motion.div>
          )}
          {!error && categories.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((category, index) => {
                const slug = toSlug(category.title);
                const bgColor = getCategoryColor(category.id, CATEGORY_COLORS);
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 300
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={`/category/${slug}`}
                      className={`flex items-center gap-3 p-4 rounded-md transition-all duration-300 hover:shadow-lg group relative overflow-hidden ${bgColor}`}
                    >
                      {/* Hover gradient overlay */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={false}
                      />
                      
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100"
                        initial={{ x: "-100%" }}
                        whileHover={{
                          x: "100%",
                          transition: { duration: 0.6, ease: "easeInOut" }
                        }}
                      />
                      
                      {category.thumbnail?.url && (
                        <motion.div
                          className="relative"
                          whileHover={{ 
                            rotate: [0, -5, 5, 0],
                            transition: { duration: 0.5 }
                          }}
                        >
                          <Image
                            src={category.thumbnail.url}
                            width={60}
                            height={60}
                            alt={category.title}
                            className="size-[60px] rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          
                          {/* Glow effect */}
                          <motion.div
                            className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            initial={false}
                          />
                        </motion.div>
                      )}
                      
                      <div className="flex-1 relative z-10">
                        <motion.div 
                          className="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors duration-300"
                          whileHover={{ x: 2 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          {category.title}
                        </motion.div>
                        
                        {productsByCategory[category.id] && productsByCategory[category.id].length > 0 && (
                          <motion.div 
                            className="text-xs text-gray-600 mt-1 overflow-hidden group-hover:text-gray-700 transition-colors duration-300"
                            initial={{ opacity: 0.8 }}
                            whileHover={{ opacity: 1 }}
                          >
                            {(() => {
                              const products = productsByCategory[category.id];
                              const maxLength = 30;
                              
                              if (products.length === 0) return null;
                              
                              let displayText = products[0].name;
                              
                              if (products.length > 1) {
                                const secondProduct = products[1].name;
                                const combined = `${displayText}, ${secondProduct}`;
                                
                                if (combined.length <= maxLength - 6) {
                                  displayText = combined;
                                }
                              }
                              
                              if (displayText.length > maxLength - 6) {
                                displayText = displayText.substring(0, maxLength - 6);
                              }
                              
                              return (
                                <motion.span 
                                  className="block truncate"
                                  whileHover={{ x: 1 }}
                                  transition={{ type: "spring", stiffness: 400 }}
                                >
                                  {displayText}...
                                </motion.span>
                              );
                            })()}
                          </motion.div>
                        )}
                      </div>
                      
                      {/* Arrow indicator */}
                      <motion.div
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                      >
                        <ChevronDownIcon className="w-4 h-4 text-gray-600 rotate-[-90deg]" />
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
      className="flex items-center gap-1 text-sm h-7 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer px-2 group"
      flyoutPosition="absolute"
      flyoutClassName="absolute left-0 !top-8 top-full w-[90vw] max-w-none bg-white text-black z-20 rounded-xl shadow-2xl border border-gray-100"
    >
      <motion.div
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.3 }}
      >
        <Menu className="h-4 w-4 transition-colors group-hover:text-[#1B6013]" />
      </motion.div>
      <span className="transition-colors group-hover:text-[#1B6013]">Categories</span>
      <motion.div
        animate={{ rotate: 0 }}
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.3 }}
      >
        <ChevronDownIcon className="w-4 h-4 ml-1 transition-colors group-hover:text-[#1B6013]" />
      </motion.div>
    </FlyoutLink>
  );
};

export default HeaderTagsClient;
