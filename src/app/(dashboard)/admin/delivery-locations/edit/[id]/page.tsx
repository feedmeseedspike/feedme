export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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

  return (
    <div className="p-6 mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/admin/delivery-locations">
          <Button variant="ghost" className="mr-2 px-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Delivery Location</h1>
      </div>
      <form className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Location Name</label>
          <Input value={data.name} placeholder="e.g. Ikeja" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Price (₦)</label>
          <Input type="number" value={data.price} min={0} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="bg-[#1B6013] text-white" disabled>
            Save Changes
          </Button>
          <Link href="/admin/delivery-locations">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
