"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { Checkbox } from "@components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { createClient } from "@utils/supabase/client";
import { fetchProductsForBundleModal } from "../../queries/products"; // Reuse the product fetching function
import { Tables } from "@utils/database.types";
import Option from "@components/icons/option.svg"; // Assuming this icon is still desired

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSubmit will now return the selected products (full objects)
  onSubmit: (selectedProducts: Tables<"products">[]) => void; // Pass selected product objects back
  existingProductIds: string[]; // Pass IDs of products already in the bundle
}

export default function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  existingProductIds, // Receive existing product IDs
}: AddProductModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    Tables<"products">[]
  >([]); // Store selected product objects

  const supabase = createClient();
  const {
    data: products,
    isLoading: isProductsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products-modal", searchQuery], // Unique query key for the modal
    queryFn: () =>
      fetchProductsForBundleModal(supabase, { search: searchQuery }),
    enabled: isOpen, // Only fetch when modal is open
  });

  const handleProductSelect = (product: Tables<"products">) => {
    setSelectedProducts((prevSelected) => {
      const isSelected = prevSelected.some((p) => p.id === product.id);
      if (isSelected) {
        return prevSelected.filter((p) => p.id !== product.id);
      } else {
        return [...prevSelected, product];
      }
    });
  };

  const handleAddSelectedProducts = () => {
    onSubmit(selectedProducts);
    onClose();
  };

  // Filter out products already added to the bundle from the main list display
  const availableProducts =
    products?.filter((product) => !existingProductIds.includes(product.id)) ||
    [];

  // Combine selected products (which might include existing ones if modal is reopened) with available products for display
  const combinedProducts = [
    ...selectedProducts.filter(
      (product) => !existingProductIds.includes(product.id)
    ), // Newly selected products
    ...availableProducts.filter(
      (product) => !selectedProducts.some((p) => p.id === product.id)
    ), // Available products not yet selected
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] lg:max-w-[640px] max-h-[90vh] overflow-y-auto">
        {" "}
        {/* Keep height constraints */}
        <DialogHeader>
          <DialogTitle className="mx-auto text-lg font-semibold flex justify-center flex-col items-center gap-2">
            {/* <Option /> */}
            Add Products to Bundle
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(90vh-150px)] overflow-y-auto pr-4">
          {" "}
          {/* Keep height constraints */}
          <div className="space-y-3">
            {/* Search Products */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium mb-2"
              >
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
              {" "}
              {/* Keep height constraints */}
              {isProductsLoading ? (
                <div>Loading products...</div>
              ) : productsError ? (
                <div>Error loading products: {productsError.message}</div>
              ) : combinedProducts && combinedProducts.length > 0 ? (
                combinedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center p-"
                  >
                    <div className="flex gap-3 items-center">
                      <Checkbox
                        className="!rounded !size-[16px] !border-[#D0D5DD]"
                        checked={
                          selectedProducts.some((p) => p.id === product.id) ||
                          existingProductIds.includes(product.id)
                        } // Check if in selectedProducts or existingProductIds
                        onCheckedChange={() => handleProductSelect(product)}
                        disabled={existingProductIds.includes(product.id)} // Disable if already in bundle
                      />
                      <p className="font-medium">{product.name}</p>
                    </div>
                    <div>
                      <p className="text-sm ">
                        ₦{product.price?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div>No products found.</div>
              )}
            </div>

            {/* Selected Products Count */}
            {selectedProducts.length > 0 && (
              <div className="text-sm font-medium mb-2">
                {selectedProducts.length} product(s) selected
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex w-full items-center justify-between space-x-2 mt-4">
          {/* No validation error for products selection in modal anymore, handled on the main page */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className=" px-10"
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="button" // Changed to type="button" as it doesn't submit a form here
              className=" bg-[#1B6013] px-12"
              onClick={handleAddSelectedProducts}
            >
              Add Selected Products
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
