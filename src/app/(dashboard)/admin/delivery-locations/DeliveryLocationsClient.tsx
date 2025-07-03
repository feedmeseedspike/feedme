"use client";
import React, { useState, useTransition } from "react";
import Link from "next/link";
import { DeliveryLocation } from "@/types/delivery-location";
import { Button } from "@components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@components/ui/dialog";
import { deleteDeliveryLocationAction } from "./actions";

interface DeliveryLocationsClientProps {
  locations: DeliveryLocation[];
}

const DeliveryLocationsClient: React.FC<DeliveryLocationsClientProps> = ({
  locations: initialLocations,
}) => {
  console.log("DELIVERY LOCATIONS:", initialLocations);
  const [locations, setLocations] =
    useState<DeliveryLocation[]>(initialLocations);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] =
    useState<DeliveryLocation | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteDeliveryLocationAction(id);
        setLocations((prev) => prev.filter((loc) => loc.id !== id));
        showToast("Location deleted", "success");
      } catch (error: any) {
        showToast(error.message || "Failed to delete location", "error");
      } finally {
        setDeletingId(null);
        setDialogOpen(false);
        setLocationToDelete(null);
      }
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-semibold">Delivery Locations</h2>
          <p className="text-[#475467]">
            Manage your delivery locations and prices here.
          </p>
        </div>
        <Link href="/admin/delivery-locations/add-new">
          <Button className="bg-[#1B6013] text-white">
            <Plus size={16} className="mr-2" /> Add New Location
          </Button>
        </Link>
      </div>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Price</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500">
                  No delivery locations found.
                </td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{loc.name}</td>
                  <td className="py-2 px-4 border-b">
                    ₦{loc.price.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <Link href={`/admin/delivery-locations/edit/${loc.id}`}>
                      <Button variant="outline" size="sm" className="mr-2">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === loc.id || isPending}
                      onClick={() => {
                        setLocationToDelete(loc);
                        setDialogOpen(true);
                      }}
                    >
                      {deletingId === loc.id || isPending ? (
                        <Loader2
                          className="animate-spin inline-block mr-1"
                          size={16}
                        />
                      ) : null}
                      {deletingId === loc.id || isPending
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Delivery Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete
              {locationToDelete ? (
                <span className="font-semibold">
                  {" "}
                  &apos;{locationToDelete.name}&apos;
                </span>
              ) : null}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setLocationToDelete(null);
              }}
              disabled={deletingId !== null || isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (locationToDelete) {
                  handleDelete(locationToDelete.id);
                }
              }}
              disabled={deletingId !== null || isPending}
            >
              {deletingId !== null || isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryLocationsClient;
