"use client";

import Container from "@components/shared/Container";
import Link from "next/link";
import React from "react";
import { headerMenus } from "src/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAllCategoriesQuery } from "src/queries/categories";
import { createClient } from "src/utils/supabase/client";
import { toSlug } from "src/lib/utils";

interface Category {
  id: string;
  title: string;
}

const Headertags = () => {
  const supabase = createClient();

  const queryFn = async () => {
    const queryBuilder = getAllCategoriesQuery(supabase);
    const { data, error } = await queryBuilder.select("*");
    if (error) throw error;
    return data as Category[];
  };

  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn,
  });

  return (
    <div className="bg-white">
      <Container>
        <div className="py-2 flex items-center gap-x-2 whitespace-nowrap scrollbar-hide w-full">
          {/* Categories Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm h-7 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
              <Menu className="h-4 w-4" />
              Categories
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-white shadow-lg rounded-md p-1">
              {isLoading && (
                <DropdownMenuItem>Loading categories...</DropdownMenuItem>
              )}
              {error && (
                <DropdownMenuItem className="text-red-500">
                  Error loading categories
                </DropdownMenuItem>
              )}
              {categories?.map((category) => (
                <Link
                  href={`/category/${toSlug(category.title)}`}
                  key={category.id}
                >
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 py-2 px-3 text-sm rounded-sm">
                    {category.title}
                  </DropdownMenuItem>
                </Link>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="border-l h-7 rounded" />
          <div className="flex items-center text-[14px] gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide w-full overflow-visible">
            {headerMenus.map((menu) => (
              <Link
                href={menu.href}
                key={menu.href}
                className="relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#1B6013] after:transition-transform after:duration-300 after:ease-&lsqb;cubic-bezier&lsqb;0.65_0.05_0.36_1&rsqb;&rsqb; hover:after:origin-bottom-left hover:after:scale-x-100"
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