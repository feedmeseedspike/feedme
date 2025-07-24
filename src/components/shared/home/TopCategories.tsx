import Stroke from "@components/shared/home/Stroke";
import Image from "next/image";
import Link from "next/link";
import { toSlug } from "src/lib/utils";
import { Tables } from "../../../utils/database.types";
type Category = Tables<"categories">;

import { createClient } from "@utils/supabase/server";

import { getAllCategoriesQuery } from "src/queries/categories";

const TopCategories = async () => {
  const supabase = await createClient();
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    const queryBuilder = getAllCategoriesQuery(supabase);
    const { data, error: fetchError } = await queryBuilder.select("*");
    if (fetchError) throw fetchError;
    categories = (data || []) as Category[];
  } catch (err: any) {
    error = err.message || "Failed to fetch categories";
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
