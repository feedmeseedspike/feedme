"use client";

import Link from "next/link";
import React from "react";
import FlyoutLink from "@components/shared/header/FlyoutLink";
import { ChevronDownIcon, Menu } from "lucide-react";
import { toSlug } from "src/lib/utils";
import Image from "next/image";

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
        <div className="p-4 w-full max-w-7x mx-auto overflow-x-auto">
          {error && <div className="p-2 text-red-500">{error}</div>}
          {!error && categories.length === 0 && (
            <div className="text-gray-500">No categories found.</div>
          )}
          {!error && categories.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ">
              {categories.map((category) => {
                const slug = toSlug(category.title);
                console.log(`Category: "${category.title}" -> Slug: "${slug}"`);
                return (
                <Link
                  href={`/category/${slug}`}
                  key={category.id}
                  className={`flex items-center gap-2 px-2 py-5 rounded hover:bg-gray-100 transition-colors ${getCategoryColor(category.id, CATEGORY_COLORS)}`}
                >
                  {category.thumbnail?.url && (
                    <Image
                      src={category.thumbnail.url}
                      width={60}
                      height={60}
                      alt={category.title}
                      className=" size-[60px]"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{category.title}</div>
                    {productsByCategory[category.id] && productsByCategory[category.id].length > 0 && (
                      <div className="text-xs text-gray-500 mt-1 overflow-hidden">
                        {(() => {
                          const products = productsByCategory[category.id];
                          const maxLength = 25; // Adjust this based on your needs
                          
                          if (products.length === 0) return null;
                          
                          let displayText = products[0].name;
                          
                          if (products.length > 1) {
                            const secondProduct = products[1].name;
                            const combined = `${displayText}, ${secondProduct}`;
                            
                            if (combined.length <= maxLength - 6) { // Reserve space for ",...etc"
                              displayText = combined;
                            }
                          }
                          
                          // Truncate if still too long
                          if (displayText.length > maxLength - 6) {
                            displayText = displayText.substring(0, maxLength - 6);
                          }
                          
                          return (
                            <span className="block truncate">
                              {displayText}, etc
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
      className="flex items-center gap-1 text-sm h-7 rounded-md hover:bg-gray-100 transition-colors cursor-pointer px-2"
      flyoutPosition="absolute"
      flyoutClassName="absolute left-0 !top-8  top-full w-[90vw] max-w-none bg-white text-black z-20 rounded-xl shadow-xl"
    >
      <Menu className="h-4 w-4" />
      <span>Categories</span>
      <ChevronDownIcon className="w-4 h-4 ml-1" />
    </FlyoutLink>
  );
};

export default HeaderTagsClient;
