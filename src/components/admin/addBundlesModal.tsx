"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Search, X } from "lucide-react";
import { Checkbox } from "@components/ui/checkbox";
import Option from "@components/icons/option.svg";

const BundleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  products: z.array(z.string()).min(1, "At least one product is required"),
});

type BundleFormValues = z.infer<typeof BundleSchema>;

interface BundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: BundleFormValues) => void;
}

const products = [
  { id: "1", name: "Banana-Large", price: "₦6000" },
  { id: "2", name: "Apple-Red", price: "₦5000" },
  { id: "3", name: "Orange", price: "₦4500" },
  { id: "4", name: "Mango", price: "₦7000" },
];

export default function BundleModal({
  isOpen,
  onClose,
  onSubmit,
}: BundleModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BundleFormValues>({
    resolver: zodResolver(BundleSchema),
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleProductSelect = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const submitForm = (data: BundleFormValues) => {
    const formData = {
      ...data,
      products: selectedProducts,
    };
    console.log(formData);
    if (onSubmit) onSubmit(formData);
    onClose();
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] lg:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="mx-auto text-lg font-semibold flex justify-center flex-col items-center gap-2">
            <Option />
            Add New Bundle
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitForm)} className="space-y-3">
          {/* Bundle Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Bundle Name
            </label>
            <Input
              {...register("name")}
              id="name"
              placeholder="Enter bundle name here"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Search Products */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium mb-2">
              Search Products
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                id="search"
                placeholder="Search products"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Product List */}
          <div className="max-h-[300px] overflow-y-auto flex flex-col gap-5 py-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center p-"
              >
                <div className="flex gap-3 items-center">
                  <Checkbox
                    className="!rounded !size-[16px] !border-[#D0D5DD]"
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={() => handleProductSelect(product.id)}
                  />
                  <p className="font-medium">{product.name}</p>
                </div>
                <div>
                  <p className="text-sm ">{product.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex w-full items-center justify-between space-x-2">
            <div className="">
              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    {selectedProducts.length} products selected
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className=" px-10">
                Cancel
              </Button>
              <Button type="submit" className=" bg-[#1B6013] px-12">
                Add
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
