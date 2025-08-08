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
  allProducts?: Tables<"products">[]; // Optional: pass products from parent to avoid refetching
}

export default function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  existingProductIds, // Receive existing product IDs
  allProducts, // Optional products from parent
}: AddProductModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    Tables<"products">[]
  >([]); // Store selected product objects
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null); // Track which product's options are expanded
  const [selectedOptions, setSelectedOptions] = useState<{[productId: string]: string}>({}); // Track selected option for each product

  const supabase = createClient();
  
  // Use provided products or fetch from API
  const {
    data: fetchedProducts,
    isLoading: isProductsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products-modal", searchQuery], // Unique query key for the modal
    queryFn: async () => {
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('is_published', true);

        if (searchQuery && searchQuery.trim() !== '') {
          query = query.ilike('name', `%${searchQuery.trim()}%`);
        }

        const { data, error } = await query
          .limit(50)
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching products:', error);
          throw new Error(`Failed to fetch products: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Error in products query:', error);
        throw error;
      }
    },
    enabled: !allProducts && isOpen, // Only fetch if no products provided and modal is open
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use passed products or fetched products, apply search filter if using passed products
  const products = allProducts ? 
    (searchQuery && searchQuery.trim() !== '' ? 
      allProducts.filter(product => 
        product.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      ) : allProducts
    ) : fetchedProducts;

  const handleProductSelect = (product: Tables<"products">) => {
    // If product has options, expand/collapse the options view
    if (product.options && Array.isArray(product.options) && product.options.length > 0) {
      if (expandedProduct === product.id) {
        setExpandedProduct(null); // Collapse if already expanded
      } else {
        setExpandedProduct(product.id); // Expand options
      }
      return; // Don't add to selected products yet
    }

    // For products without options, handle selection normally
    setSelectedProducts((prevSelected) => {
      const isSelected = prevSelected.some((p) => p.id === product.id);
      if (isSelected) {
        return prevSelected.filter((p) => p.id !== product.id);
      } else {
        return [...prevSelected, product];
      }
    });
  };

  const handleOptionSelect = (product: Tables<"products">, optionName: string) => {
    // Create a modified product with the selected option
    const productWithOption = {
      ...product,
      selectedOption: optionName,
      // Create a unique ID for this product-option combination
      id: `${product.id}-${optionName.replace(/\s+/g, '-').toLowerCase()}`,
      originalId: product.id, // Keep original ID for reference
    };

    setSelectedProducts((prevSelected) => {
      // Remove any existing selections for this product (different options)
      const filteredSelected = prevSelected.filter((p) => 
        !(p as any).originalId || (p as any).originalId !== product.id
      );
      
      return [...filteredSelected, productWithOption as any];
    });

    // Track the selected option
    setSelectedOptions(prev => ({
      ...prev,
      [product.id]: optionName
    }));

    // Collapse the options after selection
    setExpandedProduct(null);
  };

  const handleAddSelectedProducts = () => {
    onSubmit(selectedProducts);
    setSelectedProducts([]); // Clear selection
    setSearchQuery(''); // Clear search
    setExpandedProduct(null); // Clear expanded product
    setSelectedOptions({}); // Clear selected options
    onClose();
  };

  const handleClose = () => {
    setSelectedProducts([]); // Clear selection when closing without adding
    setSearchQuery(''); // Clear search
    setExpandedProduct(null); // Clear expanded product
    setSelectedOptions({}); // Clear selected options
    onClose();
  };

  // Helper function to get the correct price display for products
  const getProductPriceDisplay = (product: Tables<"products">) => {
    // If product has a base price, use it
    if (product.price && product.price > 0) {
      return `₦${product.price.toFixed(2)}`;
    }
    
    // If product has options, show price range
    if (product.options && Array.isArray(product.options) && product.options.length > 0) {
      const prices = product.options
        .map((option: any) => option.price)
        .filter((price: any) => typeof price === 'number' && price > 0);
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (minPrice === maxPrice) {
          return `₦${minPrice.toFixed(2)}`;
        } else {
          return `₦${minPrice.toFixed(2)} - ₦${maxPrice.toFixed(2)}`;
        }
      }
    }
    
    return "₦0.00";
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
              {(!allProducts && isProductsLoading) ? (
                <div>Loading products...</div>
              ) : (!allProducts && productsError) ? (
                <div>Error loading products: {productsError.message}</div>
              ) : combinedProducts && combinedProducts.length > 0 ? (
                combinedProducts.map((product) => (
                  <div key={product.id} className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded-md hover:bg-gray-50">
                      <div className="flex gap-3 items-center">
                        <Checkbox
                          className="!rounded !size-[16px] !border-[#D0D5DD]"
                          checked={
                            selectedProducts.some((p) => (p as any).originalId === product.id || p.id === product.id) ||
                            existingProductIds.includes(product.id)
                          }
                          onCheckedChange={() => handleProductSelect(product)}
                          disabled={existingProductIds.includes(product.id)}
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.options && Array.isArray(product.options) && product.options.length > 0 && (
                            <p className="text-xs text-gray-500">
                              {expandedProduct === product.id ? 'Click to collapse options' : 'Click to view options'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm">
                          {getProductPriceDisplay(product)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Options dropdown */}
                    {expandedProduct === product.id && product.options && Array.isArray(product.options) && (
                      <div className="ml-8 space-y-1 border-l-2 border-gray-200 pl-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Select an option:</p>
                        {product.options.map((option: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                            onClick={() => handleOptionSelect(product, option.name)}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full border-2 ${
                                selectedOptions[product.id] === option.name 
                                  ? 'bg-[#1B6013] border-[#1B6013]' 
                                  : 'border-gray-300'
                              }`} />
                              <span className="text-sm">{option.name}</span>
                            </div>
                            <span className="text-sm font-medium">₦{option.price?.toFixed(2) || '0.00'}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
              onClick={handleClose}
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
