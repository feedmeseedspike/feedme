import { createClient } from "@utils/supabase/server";
import TagBannersManagerClient from "./TagBannersManagerClient";
import { Tables } from "src/utils/database.types";

export default async function TagBannersManager() {
  const supabase = await createClient();
  // Fetch non-featured promotions
  const { data: promotions } = await supabase
      .from("promotions") 
    .select("*")
    .eq("is_featured_on_homepage", false);
  // Optionally handle error
  return <TagBannersManagerClient promotions={promotions || []} />;
}
