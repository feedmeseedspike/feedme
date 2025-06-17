"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tables } from "src/utils/database.types";

import {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "src/queries/addresses";
import {
  UserAddressSchema,
  UserAddress,
  AddressWithId,
} from "src/lib/validator";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
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

// Define form schema based on the validator schema
const FormAddressSchema = UserAddressSchema;

const AddressesPage = () => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressWithId | null>(
    null
  );

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(
    null
  );

  // Fetch addresses
  const {
    data: addresses,
    isLoading,
    error,
  } = useQuery<AddressWithId[] | null, Error>({
    queryKey: ["userAddresses"],
    queryFn: getUserAddresses,
  });

  // Form for adding/editing addresses
  const form = useForm<z.infer<typeof FormAddressSchema>>({
    resolver: zodResolver(FormAddressSchema),
    defaultValues: {
      label: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phone: "",
    },
  });

  // Populate form when editingAddress changes
  useEffect(() => {
    if (editingAddress) {
      form.reset(editingAddress);
      setShowAddForm(true); // Show the form when editing
    } else {
      form.reset();
    }
  }, [editingAddress, form]);

  // Add Address Mutation
  const addAddressMutation = useMutation({
    mutationFn: addAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      toast.success("Address added successfully!");
      form.reset();
      setShowAddForm(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add address.");
    },
  });

  // Update Address Mutation
  const updateAddressMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<UserAddress>;
    }) => updateAddress(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      toast.success("Address updated successfully!");
      form.reset();
      setShowAddForm(false);
      setEditingAddress(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update address.");
    },
  });

  // Delete Address Mutation
  const deleteAddressMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      toast.success("Address deleted successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete address.");
    },
  });

  const onSubmit = async (values: z.infer<typeof FormAddressSchema>) => {
    // Map form values to the expected database type, converting empty string label to null
    const addressData = {
      ...values,
      label: values.label === "" ? null : values.label,
    };

    if (editingAddress) {
      // Update existing address
      // Filter out null label for the update mutation as UserAddressSchema label is string | undefined
      const updates: Partial<UserAddress> = {};
      for (const key in addressData) {
        if (addressData[key] !== null) {
          // Need to cast key because Object.keys returns string[], but we know they are keys of addressData
          (updates as any)[key] = addressData[key];
        }
      }

      updateAddressMutation.mutate({ id: editingAddress.id, updates });
    } else {
      // Add new address
      addAddressMutation.mutate(
        addressData as Omit<
          Tables<"addresses">,
          "id" | "user_id" | "created_at" | "updated_at"
        >
      );
    }
  };

  const handleEditClick = (address: AddressWithId) => {
    setEditingAddress(address);
  };

  const handleDeleteClick = (id: string) => {
    setAddressToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#1B6013]" />
            Manage Addresses
          </h1>
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
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>
                {editingAddress ? "Edit Address" : "Add New Address"}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                        <FormLabel>Label (e.g., Home, Work)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Home, Work" />
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
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter street address"
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
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter city" />
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
                          <FormLabel>State / Province</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter state or province"
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
                          <FormLabel>Zip / Postal Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter zip or postal code"
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
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter phone number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-[#1B6013] hover:bg-green-700"
                    disabled={
                      addAddressMutation.isPending ||
                      updateAddressMutation.isPending
                    }
                  >
                    {(addAddressMutation.isPending ||
                      updateAddressMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingAddress ? "Update Address" : "Add Address"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Address List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Your Saved Addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#1B6013]" />
                <span className="ml-2 text-gray-600">Loading addresses...</span>
              </div>
            ) : error ? (
              <p className="text-red-600">
                Error loading addresses: {error.message}
              </p>
            ) : addresses && addresses.length > 0 ? (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className="border rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold">
                      {address.label || "Unnamed Address"}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {address.street}, {address.city}, {address.state}{" "}
                      {address.zip}
                    </p>
                    <p className="text-gray-600 text-sm">{address.country}</p>
                    <p className="text-gray-600 text-sm">
                      Phone: {address.phone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClick(address)}
                      disabled={deleteAddressMutation.isPending}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="hover:bg-red-100"
                      onClick={() => handleDeleteClick(address.id)}
                      disabled={deleteAddressMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">
                No addresses saved yet. Add your first address above!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="submit"
              onClick={() => {
                if (addressToDeleteId) {
                  deleteAddressMutation.mutate(addressToDeleteId);
                }
              }}
            >
              Delete
            </Button>
            <Button type="reset" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressesPage;
