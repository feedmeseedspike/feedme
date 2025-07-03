"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { DeliveryLocation } from "@/types/delivery-location";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/useToast";
import { ArrowLeft } from "lucide-react";

// TODO: Replace with real fetch/update from Supabase
async function getDeliveryLocation(
  id: string
): Promise<DeliveryLocation | null> {
  // Placeholder: fetch from API or Supabase client
  return null;
}

export default function EditDeliveryLocationPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const id = params?.id as string;
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchLocation = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("delivery_locations")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setError("Failed to load location");
        showToast("Failed to load location", "error");
      } else {
        setName(data.name);
        setPrice(data.price);
      }
    };
    fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("delivery_locations")
        .update({ name, price })
        .eq("id", id);
      if (error) {
        if (error.code === "23505" || error.message.includes("duplicate")) {
          setError("A location with this name already exists.");
          showToast("A location with this name already exists.", "error");
        } else {
          setError(error.message || "Failed to update location");
          showToast(error.message || "Failed to update location", "error");
        }
      } else {
        showToast("Location updated successfully!", "success");
        router.push("/admin/delivery-locations");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update location");
      showToast(err.message || "Failed to update location", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mr-2 px-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Delivery Location</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Location Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Ikeja"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Price (₦)</label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
            min={0}
          />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#1B6013] text-white"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
