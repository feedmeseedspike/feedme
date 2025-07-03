"use client";

import Stroke from "@components/shared/home/Stroke";
import Image from "next/image";
import Link from "next/link";
import { toSlug } from "src/lib/utils";
import { Skeleton } from "@components/ui/skeleton";
import { Tables } from "../../../utils/database.types";
type Category = Tables<"categories">;
import { useQuery } from "@tanstack/react-query";

import { createClient } from "@utils/supabase/client";

import { getAllCategoriesQuery } from "src/queries/categories";

const TopCategories = () => {
  const supabase = createClient();

  const queryKey = ["categories"];

  // Define the query function
  const queryFn = async () => {
    const queryBuilder = getAllCategoriesQuery(supabase);
    const { data, error } = await queryBuilder.select("*");
    if (error) throw error;
    return data;
  };

  const {
    data: categories,
    isLoading,
    error,
  } = useQuery<Category[] | null, any>({
    queryKey: queryKey,
    queryFn: queryFn,
  });


  if (isLoading) {
    return (
      <section className="w-full pb-[80px]">
        <Stroke />
        <div className="flex gap-3 md:gap-6 pt-6 cursor-pointer overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide w-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 justify-center items-center flex-shrink-0"
            >
              <Skeleton className="size-[6rem] md:size-[8rem] rounded-[100%]" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || !categories || !Array.isArray(categories)) {
    return <div>Error loading categories or no categories found.</div>;
  }

  return (
    <section className="w-full pb-[80px]">
      {/* <Container> */}
      <Stroke />
      <div className="flex gap-3 md:gap-6 pt-6 cursor-pointer overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide w-full">
        {categories
          .filter((category) => !!category.id)
          .map((category: Category) => {
            return (
              <Link
                href={`/category/${toSlug(category?.title)}`}
                className="flex flex-col gap-2 justify-center items-center flex-shrink-0"
                key={category.id!}
              >
                <div className="size-[6rem] md:size-[8rem] bg-[#F2F4F7] rounded-[100%] p-3 flex justify-center items-center">
                  {category.thumbnail && (
                    <Image
                      src={(category.thumbnail as { url: string }).url}
                      width={150}
                      height={150}
                      alt={category.title}
                      className="hover:scale-110 hover:transition-transform hover:ease-in-out hover:duration-500 object-contain"
                    />
                  )}
                </div>
                <p className="text-[14px] md:text-[22px] md:text-lg text-black hover:underline hover:underline-offset-2">
                  {category.title}
                </p>
              </Link>
            );
          })}
      </div>
      {/* </Container> */}
    </section>
  );
};
export default TopCategories;
