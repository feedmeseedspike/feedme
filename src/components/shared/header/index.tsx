import { createClient } from "@utils/supabase/server";
import { Tables } from "src/utils/database.types";
import HeaderClient from "./HeaderClient";

// Define the Category type
type Category = Tables<"categories">;

export default async function Header() {
  const supabase = await createClient();
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*");
  const user = null;

  return (
    <HeaderClient
      categories={categories || []}
      categoriesError={categoriesError?.message || null}
      user={user}
    />
  );
}
