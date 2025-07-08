export const dynamic = "force-dynamic";
import { getUser } from "src/lib/actions/auth.actions";
import { createClient } from "@utils/supabase/server";
import { redirect } from "next/navigation";
import AddressesClient from "./AddressesClient";

export default async function AddressesPage() {
  // 1. Get authenticated user
  const user = await getUser();
  if (!user) {
    return redirect("/login?callbackUrl=/account/addresses");
  }

  const supabase = await createClient();

  const { data: addresses, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.user_id)
    .order("created_at", { ascending: true });

  if (error) {
    return <div>Error loading addresses.</div>;
  }

  // Map nulls to empty strings to match AddressWithId type
  const mappedAddresses = (addresses || []).map((addr: any) => ({
    id: addr.id,
    label: addr.label ?? "",
    street: addr.street ?? "",
    city: addr.city ?? "",
    state: addr.state ?? "",
    zip: addr.zip ?? "",
    country: addr.country ?? "",
    phone: addr.phone ?? "",
  }));

  return <AddressesClient user={user} addresses={mappedAddresses} />;
}
