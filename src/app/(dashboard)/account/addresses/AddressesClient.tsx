"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tables } from "src/utils/database.types";
import {
  UserAddressSchema,
  UserAddress,
  AddressWithId,
} from "src/lib/validator";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { Loader2, MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useTransition } from "react";
import {
  addAddressAction,
  updateAddressAction,
  deleteAddressAction,
} from "./actions";
// import { createClient } from "@/utils/supabase/server";

const FormAddressSchema = UserAddressSchema;
type FormValues = z.infer<typeof FormAddressSchema>;

export default function AddressesClient({
  user,
  addresses: initialAddresses,
}: {
  user: any;
  addresses: AddressWithId[];
}) {
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressWithId | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(
    null
  );
  const [addresses, setAddresses] = useState<AddressWithId[]>(initialAddresses);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormAddressSchema),
    defaultValues: {
      label: "Home",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phone: "",
    },
  });

  React.useEffect(() => {
    if (editingAddress) {
      form.reset(editingAddress);
      setShowAddForm(true);
    } else {
      form.reset();
    }
  }, [editingAddress, form]);

  // Helper to map address fields to AddressWithId (no nulls)
  function mapAddressFields(addr: any): AddressWithId {
    return {
      id: addr.id,
      label: addr.label ?? "",
      street: addr.street ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      zip: addr.zip ?? "",
      country: addr.country ?? "",
      phone: addr.phone ?? "",
    };
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    // console.log("onSubmit started");
    startTransition(async () => {
      try {
        if (editingAddress) {
          const updatedAddress = await updateAddressAction(
            editingAddress.id,
            values
          );
          if (updatedAddress) {
            setAddresses((prev) =>
              prev.map((addr) =>
                addr.id === editingAddress.id
                  ? mapAddressFields(updatedAddress)
                  : addr
              )
            );
            showToast("Address updated successfully", "success");
          }
          setEditingAddress(null);
        } else {
          const addressData: Omit<
            Tables<"addresses">,
            "id" | "user_id" | "created_at" | "updated_at"
          > = {
            label: values.label || "",
            street: values.street || "",
            city: values.city || "",
            state: values.state || "",
            zip: values.zip || "",
            country: values.country || "",
            phone: values.phone || "",
          };
          const newAddress = await addAddressAction(addressData);
          if (newAddress) {
            setAddresses((prev) => [...prev, mapAddressFields(newAddress)]);
            showToast("Address added successfully", "success");
          }
        }
        setShowAddForm(false);
        form.reset();
      } catch (err: any) {
        console.error("onSubmit error:", err);
        showToast(err.message || "Failed to save address", "error");
      } finally {
        setLoading(false);
        // console.log("onSubmit finally, loading set to false");
      }
    });
  };

  const handleEditClick = (address: AddressWithId) => {
    setEditingAddress(address);
  };

  const handleDeleteClick = (id: string) => {
    setAddressToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (addressToDeleteId) {
      setLoading(true);
      startTransition(async () => {
        try {
          await deleteAddressAction(addressToDeleteId);
          setAddresses((prev) =>
            prev.filter((addr) => addr.id !== addressToDeleteId)
          );
          showToast("Address deleted successfully", "success");
        } catch (err: any) {
          showToast(err.message || "Failed to delete address", "error");
        } finally {
          setLoading(false);
          setIsDeleteDialogOpen(false);
          setAddressToDeleteId(null);
        }
      });
    }
  };

  if (!user) return null;

  // Map addresses to AddressWithId (convert nulls to empty strings)
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

  return (
    <div className="">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="">
          <div className="pb-6 border-b border-gray-200 mb-3 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-[#1B6013]" />
                Manage Addresses
              </h2>
              <p className="text-gray-600">Manage your delivery addresses</p>
            </div>
            <Button
              onClick={() => {
                setEditingAddress(null);
                setShowAddForm(!showAddForm);
              }}
              className="bg-[#1B6013] hover:bg-green-700"
            >
              {showAddForm ? (
                "Cancel"
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add New Address
                </>
              )}
            </Button>
          </div>

          {/* Add/Edit Address Form */}
          {showAddForm && (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold mb-6 text-gray-800">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h3>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Label (e.g., Home, Work)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Home, Work"
                            className="h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Street Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter street address"
                            className="h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            City
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter city"
                              className="h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            State
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter state"
                              className="h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            ZIP Code
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter ZIP code"
                              className="h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Country
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter country"
                              className="h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter phone number"
                            className="h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingAddress(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#1B6013]/90 hover:bg-[#1B6013] text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingAddress ? "Update" : "Save"} Address
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Address List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Your Addresses
            </h3>
            {addresses.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No addresses found</p>
                <p className="text-sm">Add your first address to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="p-6 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-[#1B6013]" />
                          <h4 className="font-semibold text-lg text-gray-800">
                            {address.label}
                          </h4>
                        </div>
                        <div className="text-gray-600 space-y-1">
                          <p>{address.street}</p>
                          <p>
                            {address.city}, {address.state} {address.zip}
                          </p>
                          <p>{address.country}</p>
                          {address.phone && (
                            <p className="mt-2">{address.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(address)}
                          className="border-[#1B6013] text-[#1B6013] hover:bg-[#1B6013]/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteClick(address.id)}
                          className="text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Address</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this address? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
