export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import EditDeliveryLocationClient from "./EditDeliveryLocationClient";

interface EditDeliveryLocationPageProps {
  params: { id: string };
}

export default async function EditDeliveryLocationPage({
  params,
}: EditDeliveryLocationPageProps) {
  const id = params.id;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_locations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return <div className="p-4 text-red-500">Failed to load location</div>;
  }

  return <EditDeliveryLocationClient initialData={data} />;
}
