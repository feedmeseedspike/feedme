import Stroke from "@components/shared/home/Stroke";
import { toSlug } from "src/lib/utils";
import { Tables } from "../../../utils/database.types";
import TopCategoriesClient from "./TopCategoriesClient";
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
      <Stroke />
      <TopCategoriesClient categories={categories} />
    </section>
  );
};
export default TopCategories;
