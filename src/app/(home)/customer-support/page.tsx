export const dynamic = "force-dynamic";
import { createClient } from "@utils/supabase/server";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import Container from "@components/shared/Container";
import CustomerSupportClient from "./CustomerSupportClient";

export default async function CustomerSupportPage() {
  const supabase = await createClient();
  
  // Fetch delivery locations from database
  const { data: locations, error } = await supabase
    .from("delivery_locations")
    .select("id, name, price")
    .order("name", { ascending: true });

  const deliveryLocations = locations || [];

  return (
    <>
      <div className="bg-white">
        <Container className="py-4">
          <CustomBreadcrumb />
        </Container>
      </div>

      <Container>
        <CustomerSupportClient deliveryLocations={deliveryLocations} />
      </Container>
    </>
  );
}