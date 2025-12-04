import { createClient } from "@utils/supabase/server";
import BlackFridayManagerClient from "./BlackFridayManagerClient";

export default async function BlackFridayManager() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("black_friday_items")
    .select(
      `*,
      products(*)
    `
    )
    .order("created_at", { ascending: false });

  return <BlackFridayManagerClient items={data ?? []} />;
}



