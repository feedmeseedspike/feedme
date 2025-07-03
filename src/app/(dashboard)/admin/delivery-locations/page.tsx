export const dynamic = "force-dynamic";
import { createClient } from "@utils/supabase/server";
import DeliveryLocationsClient from "./DeliveryLocationsClient";

export default async function DeliveryLocationsPage() {
  const supabase = createClient();
  const { data: locations, error } = await supabase
    .from("delivery_locations")
    .select("*")
    .order("name", { ascending: true });


  if (error) {
    return <div className="p-4 text-red-500">Failed to fetch locations</div>;
  }

  return <DeliveryLocationsClient locations={locations || []} />;
}
