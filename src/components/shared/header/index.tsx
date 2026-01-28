import { createClient } from "@utils/supabase/server";
import { Tables } from "src/utils/database.types";
import HeaderClient from "./HeaderClient";

// Define the Category type
type Category = Tables<"categories">;

export default async function Header() {
  const supabase = await createClient();

  // Fetch categories
  const { data: rawCategories, error: categoriesError } = await supabase
    .from("categories")
    .select("*");

  const categories = (rawCategories || []).filter(c => 
    !c.title.toLowerCase().includes("spin") && 
    !c.title.toLowerCase().includes("wheel")
  );

  // Fetch active jobs for hiring badge
  let hasActiveJobs = false;
  try {
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id")
      .eq("status", "active")
      .limit(1);

    hasActiveJobs = !jobsError && jobs && jobs.length > 0;
  } catch (error) {
    // Silently fail - don't show hiring badge if we can't fetch jobs
    console.warn("Could not fetch active jobs for hiring badge:", error);
    hasActiveJobs = false;
  }

  const user = null;

  return (
    <HeaderClient
      categories={categories || []}
      categoriesError={categoriesError?.message || null}
      user={user}
      hasActiveJobs={hasActiveJobs}
    />
  );
}
