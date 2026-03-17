"use client";
import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { DeliveryLocation } from "@/types/delivery-location";
import { Button } from "@components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@components/ui/select";
import { Plus, Loader2, Search, Trash2, Edit3, X, Check, Save, Filter } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Input } from "@components/ui/input";
import { Checkbox } from "@components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@components/ui/dialog";
import { 
  deleteDeliveryLocationAction, 
  bulkUpdateDeliveryPriceAction, 
  bulkDeleteDeliveryLocationsAction 
} from "./actions";
import { cn } from "@/lib/utils";

interface DeliveryLocationsClientProps {
  locations: DeliveryLocation[];
}

const DeliveryLocationsClient: React.FC<DeliveryLocationsClientProps> = ({
  locations: initialLocations,
}) => {
  const [locations, setLocations] = useState<DeliveryLocation[]>(initialLocations);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  // Deletion state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<DeliveryLocation | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Bulk Price Update state
  const [bulkPriceDialogOpen, setBulkPriceDialogOpen] = useState(false);
  const [newBulkPrice, setNewBulkPrice] = useState<number>(0);

  // Get unique prices for the filter dropdown
  const uniquePrices = useMemo(() => {
    const prices = Array.from(new Set(locations.map((loc) => loc.price)));
    return prices.sort((a, b) => a - b);
  }, [locations]);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = priceFilter === "all" || loc.price.toString() === priceFilter;
      return matchesSearch && matchesPrice;
    });
  }, [locations, searchQuery, priceFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLocations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLocations.map((loc) => loc.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteDeliveryLocationAction(id);
        setLocations((prev) => prev.filter((loc) => loc.id !== id));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        showToast("Location deleted", "success");
      } catch (error: any) {
        showToast(error.message || "Failed to delete location", "error");
      } finally {
        setDeleteDialogOpen(false);
        setLocationToDelete(null);
      }
    });
  };

  const handleBulkDelete = async () => {
    startTransition(async () => {
      try {
        await bulkDeleteDeliveryLocationsAction(selectedIds);
        setLocations((prev) => prev.filter((loc) => !selectedIds.includes(loc.id)));
        showToast(`${selectedIds.length} locations deleted`, "success");
        setSelectedIds([]);
      } catch (error: any) {
        showToast(error.message || "Failed to delete locations", "error");
      } finally {
        setDeleteDialogOpen(false);
        setIsBulkDeleting(false);
      }
    });
  };

  const handleBulkPriceUpdate = async () => {
    if (newBulkPrice < 0) {
      showToast("Price cannot be negative", "error");
      return;
    }
    startTransition(async () => {
      try {
        await bulkUpdateDeliveryPriceAction(selectedIds, newBulkPrice);
        setLocations((prev) =>
          prev.map((loc) =>
            selectedIds.includes(loc.id) ? { ...loc, price: newBulkPrice } : loc
          )
        );
        showToast(`Prices updated for ${selectedIds.length} locations`, "success");
        setBulkPriceDialogOpen(false);
        setSelectedIds([]);
      } catch (error: any) {
        showToast(error.message || "Failed to update prices", "error");
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Delivery Locations</h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage regions and shipping costs for your customers.
          </p>
        </div>
        <Link href="/admin/delivery-locations/add-new">
          <Button className="bg-[#1B6013] hover:bg-[#154d10] text-white shadow-sm transition-all active:scale-95">
            <Plus size={18} className="mr-2" /> Add Location
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search locations..."
              className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="bg-gray-100 p-2.5 rounded-lg border border-gray-200 text-gray-500">
                <Filter size={20} />
             </div>
             <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-11 bg-gray-50/50 border-gray-200 font-medium rounded-lg">
                  <SelectValue placeholder="Filter by Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  {uniquePrices.map((price) => (
                    <SelectItem key={price} value={price.toString()}>
                      ₦{price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
             </Select>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="text-sm font-bold text-[#1B6013] bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
              {selectedIds.length} Selected
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setNewBulkPrice(0);
                setBulkPriceDialogOpen(true);
              }}
            >
              <Edit3 size={16} className="mr-2" /> Change Price
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-10"
              onClick={() => {
                setIsBulkDeleting(true);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-gray-400 hover:text-gray-600"
              onClick={() => setSelectedIds([])}
            >
              <X size={16} />
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="py-4 px-6 w-12">
                  <Checkbox
                    checked={selectedIds.length === filteredLocations.length && filteredLocations.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">LGA / Neighborhood</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery Fee</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <Search size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium">No locations found</p>
                      <p className="text-sm">Try adjusting your search query</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => (
                  <tr 
                    key={loc.id} 
                    className={cn(
                      "group hover:bg-gray-50/80 transition-colors",
                      selectedIds.includes(loc.id) && "bg-green-50/30 hover:bg-green-50/50"
                    )}
                  >
                    <td className="py-4 px-6">
                      <Checkbox
                        checked={selectedIds.includes(loc.id)}
                        onCheckedChange={() => toggleSelect(loc.id)}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-gray-900">{loc.name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold bg-gray-100 text-gray-800 border border-gray-200">
                        ₦{loc.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link href={`/admin/delivery-locations/edit/${loc.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-[#1B6013]">
                          <Edit3 size={16} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => {
                          setLocationToDelete(loc);
                          setDeleteDialogOpen(true);
                          setIsBulkDeleting(false);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isBulkDeleting ? `Delete ${selectedIds.length} Locations?` : "Delete Location?"}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {isBulkDeleting 
                ? "This will permanently remove all selected locations and their pricing data. This action cannot be reversed."
                : `Are you sure you want to delete '${locationToDelete?.name}'? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              disabled={isPending}
              className="rounded-xl grow"
              onClick={() => {
                setDeleteDialogOpen(false);
                setLocationToDelete(null);
                setIsBulkDeleting(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              className="rounded-xl px-8 grow"
              onClick={() => {
                if (isBulkDeleting) handleBulkDelete();
                else if (locationToDelete) handleDelete(locationToDelete.id);
              }}
            >
              {isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              {isBulkDeleting ? "Delete Selected" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Price Dialog */}
      <Dialog open={bulkPriceDialogOpen} onOpenChange={setBulkPriceDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
              <span className="text-2xl font-bold text-[#1B6013]">₦</span>
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold">Update Prices</DialogTitle>
              <DialogDescription>
                Set a new delivery fee for the {selectedIds.length} selected areas.
              </DialogDescription>
            </div>
          </div>
          
          <div className="mt-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">New Delivery Fee (₦)</label>
              <Input
                type="number"
                placeholder="2500"
                className="h-14 text-xl font-bold rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white text-center"
                value={newBulkPrice}
                onChange={(e) => setNewBulkPrice(Number(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button
                variant="outline"
                className="h-12 rounded-xl font-bold border-gray-200"
                onClick={() => setBulkPriceDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                className="h-12 rounded-xl bg-[#1B6013] hover:bg-[#154d10] font-bold text-white shadow-lg shadow-green-100"
                onClick={handleBulkPriceUpdate}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save size={18} className="mr-2" />}
                Update Fee
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryLocationsClient;
