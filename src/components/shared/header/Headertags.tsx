"use client";

import Container from "@components/shared/Container";
import Link from "next/link";
import React from "react";
import { headerMenus } from "src/lib/data";
import { AnimatePresence, motion } from "framer-motion";
import FlyoutLink from "@components/shared/header/FlyoutLink";
import { ChevronDownIcon, Menu } from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getAllCategoriesQuery } from "src/queries/categories";
import { getProducts } from "src/queries/products";
import { createClient } from "src/utils/supabase/client";
import { toSlug } from "src/lib/utils";
import Image from "next/image";

interface Category {
  id: string;
  title: string;
  thumbnail?: {
    url: string;
    public_id?: string;
  };
}

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

const CategoriesFlyout = ({
  categories,
  isLoading,
  error,
  productsByCategory,
}: {
  categories: Category[];
  isLoading: boolean;
  error: any;
  productsByCategory?: Record<string, string[]>;
}) => (
  <div className="p-4 w-full max-w-7x mx-auto overflow-x-auto">
    {isLoading ? (
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-2 py-5 rounded bg-gray-100 animate-pulse"
          >
            <div className="rounded-full bg-gray-200 w-[60px] h-[60px]" />
            <div className="flex flex-col gap-2 w-full">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    ) : null}
    {error && <div className="p-2 text-red-500">Error loading categories</div>}
    <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 ">
      {categories.map((category) => (
        <Link
          href={`/category/${toSlug(category.title)}`}
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
          <div>
            <span>{category.title}</span>
            {productsByCategory?.[category.id]?.length ? (
              <p className="text-xs text-gray-600 mt-1 truncate overflow-hidden whitespace-nowrap block w-full max-w-[200px]">
                {productsByCategory[category.id].join(", ")}, etc
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  </div>
);

const Headertags = () => {
  const supabase = createClient();

  const queryFn = async () => {
    const queryBuilder = getAllCategoriesQuery(supabase);
    const { data, error } = await queryBuilder.select("*");
    if (error) throw error;
    return data as any;
  };

  const {
    data: categories,
    isLoading,
    error,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn,
  });

  // Safely map categories to ensure thumbnail is an object with a url
  const safeCategories = (categories || []).map((cat) => ({
    ...cat,
    thumbnail:
      cat.thumbnail &&
      typeof cat.thumbnail === "object" &&
      !Array.isArray(cat.thumbnail) &&
      "url" in cat.thumbnail
        ? cat.thumbnail
        : undefined,
  })) as unknown as Category[];

  // Fetch up to 3 product names for each category by id using useQueries
  const productQueries = useQueries({
    queries: safeCategories.map((cat) => ({
      queryKey: ["products-for-category", cat.id],
      queryFn: async () => {
        const { data } = await getProducts({ category: cat.id, limit: 2 });
        return (data || []).map((p: any) => p.name);
      },
      enabled: !!cat.id,
    })),
  });

  const productsByCategory: Record<string, string[]> = {};
  safeCategories.forEach((cat, idx) => {
    productsByCategory[cat.id] = productQueries[idx]?.data || [];
  });

  return (
    <div className="bg-white">
      <Container>
        <div className="py-2 flex items-center gap-x-2 whitespace-nowrap scrollbar-hide w-full">
          {/* Categories Flyout */}
          <FlyoutLink
            FlyoutContent={() => (
              <CategoriesFlyout
                categories={safeCategories}
                isLoading={isLoading}
                error={error}
                productsByCategory={productsByCategory}
              />
            )}
            className="flex items-center gap-1 text-sm h-7 rounded-md hover:bg-gray-100 transition-colors cursor-pointer px-2"
            flyoutPosition="absolute"
            flyoutClassName="absolute left-0 !top-8  top-full w-[90vw] max-w-none bg-white text-black z-20 rounded-xl shadow-xl"
          >
            <Menu className="h-4 w-4" />
            <span>Categories</span>
            <ChevronDownIcon className="w-4 h-4 ml-1" />
          </FlyoutLink>

          <div className="border-l h-7 rounded" />
          <div className="flex items-center text-[14px] gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide w-full overflow-visible">
            {headerMenus.map((menu) => (
              <Link
                href={menu.href}
                key={menu.href}
                className="relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#1B6013] after:transition-transform after:duration-300 after:ease-[cubic-bezier[0.65_0.05_0.36_1]] hover:after:origin-bottom-left hover:after:scale-x-100"
              >
                {menu.name}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Headertags;
