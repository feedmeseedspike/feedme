"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface EditDeliveryLocationClientProps {
  initialData: { id: string; name: string; price: number };
}

export default function EditDeliveryLocationClient({ initialData }: EditDeliveryLocationClientProps) {
  const [name, setName] = useState(initialData.name);
  const [price, setPrice] = useState(initialData.price);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/delivery-locations/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initialData.id, name, price: Number(price) }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Delivery location updated!", "success");
        router.push("/admin/delivery-locations");
      } else {
        showToast(data.error || "Failed to update location", "error");
      }
    } catch (err) {
      showToast("An error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

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
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1 font-medium">Location Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ikeja" required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Price (₦)</label>
          <Input type="number" value={price} min={0} onChange={e => setPrice(Number(e.target.value))} required />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="bg-[#1B6013] text-white" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Link href="/admin/delivery-locations">
            <Button type="button" variant="outline" disabled={loading}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
} 