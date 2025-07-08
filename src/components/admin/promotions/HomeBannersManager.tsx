import { createClient } from "@utils/supabase/server";
import HomeBannersManagerClient from "./HomeBannersManagerClient";
import { Tables } from "src/utils/database.types";

export default async function HomeBannersManager() {
  const supabase = await createClient();

  // Fetch banners
  const { data: banners, error: bannersError } = await supabase
        .from("banners")
        .select("*, bundles(*)")
        .order("type", { ascending: true })
        .order("order", { ascending: true });

  // Fetch promotions
  const { data: promotions, error: promotionsError } = await supabase
    .from("promotions")
    .select("*");

  // Fetch bundles
  const { data: bundles, error: bundlesError } = await supabase
    .from("bundles")
    .select("*");

  // Optionally handle errors here

  return (
    <HomeBannersManagerClient
      banners={banners || []}
      promotions={promotions || []}
      bundles={bundles || []}
    />
  );
}
