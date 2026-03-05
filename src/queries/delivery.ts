import { createClient } from "src/utils/supabase/client";
import { DeliveryLocation } from "@/types/delivery-location";

export async function getDeliveryLocations(): Promise<DeliveryLocation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("delivery_locations")
    .select("*")
    .order("name", { ascending: true });
    
  if (error) {
    console.error("Error fetching delivery locations:", error);
    return [];
  }
  
  return data || [];
}
