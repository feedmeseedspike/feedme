import { createClient } from "@utils/supabase/server";
import PromoCardsManagerClient from "./PromoCardsManagerClient";
import { Tables } from "src/utils/database.types";

export default async function PromoCardsManager() {
  const supabase = await createClient();
  // Fetch featured promotions
  const { data: promotions, error } = await supabase
      .from("promotions") 
    .select("*")
    .eq("is_featured_on_homepage", true);
  // Optionally handle error
  return <PromoCardsManagerClient promotions={promotions || []} />;
}
