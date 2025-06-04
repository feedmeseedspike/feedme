"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { Trash2 } from "lucide-react"; // For delete icon
import Image from "next/image";
import AddProductModal from "@components/admin/addProductModal"; // Corrected import to default
import { Tables } from "@utils/database.types";
import { formatNaira } from "src/lib/utils";
import { useToast } from "../../../../../hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBundleWithProducts } from "../../../../../queries/bundles";
import CustomBreadcrumb from "@components/shared/breadcrumb";

// Define a schema for the bundle form
const BuildBundleSchema = z.object({
  name: z.string().min(1, "Bundle name is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"), // Add price field
  discount: z.coerce.number().min(0).max(100).optional(), // Add optional discount field (0-100)
  bundle_image: z.instanceof(FileList).optional(), // Add optional image file
  // products will be managed separately for now
});

type BuildBundleFormValues = z.infer<typeof BuildBundleSchema>;

export default function BuildNewBundlePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BuildBundleFormValues>({
    resolver: zodResolver(BuildBundleSchema),
  });

  // State to hold the list of products in the bundle
  // We'll store product objects here, not just IDs, to display details
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false); // State for modal visibility
  const [bundleProducts, setBundleProducts] = useState<Tables<"products">[]>(
    []
  ); // State to hold product objects

  const handleAddProductsClick = () => {
    setIsAddProductModalOpen(true); // Open the modal
  };

  const handleProductsSelected = (selectedProducts: Tables<"products">[]) => {
    // Add the newly selected products to the bundleProducts state
    setBundleProducts((prevProducts) => {
      // Filter out any selected products that are already in the bundle
      const newProducts = selectedProducts.filter(
        (newProduct) =>
          !prevProducts.some(
            (existingProduct) => existingProduct.id === newProduct.id
          )
      );
      return [...prevProducts, ...newProducts];
    });
    setIsAddProductModalOpen(false); // Close the modal after selection
  };

  const handleRemoveProduct = (productId: string) => {
    setBundleProducts(
      bundleProducts.filter((product) => product.id !== productId)
    );
  };

  // Mutation for creating the bundle
  const createBundleMutation = useMutation({
    mutationFn: createBundleWithProducts,
    onSuccess: () => {
      showToast("Bundle created successfully.", "success");
      // Optionally redirect to the bundles list page or the new bundle's detail page
      router.push("/admin/bundles");
      // Invalidate the bundles list query to show the new bundle immediately
      queryClient.invalidateQueries({ queryKey: ["bundles"] as const });
    },
    onError: (error) => {
      console.error("Error creating bundle:", error);
      showToast(`Failed to create bundle: ${error.message}`, "error");
    },
  });

  const onSubmit = (data: BuildBundleFormValues) => {
    console.log("Form data submitted:", data);
    console.log("Bundle Products:", bundleProducts);

    if (bundleProducts.length === 0) {
      showToast("Please add at least one product to the bundle.", "error");
      return;
    }

    // Call the mutation
    createBundleMutation.mutate({
      name: data.name,
      price: data.price,
      discount: data.discount,
      imageFile: data.bundle_image?.[0], // Get the first file from the FileList
      productIds: bundleProducts.map((p) => p.id), // Extract product IDs
    });
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <CustomBreadcrumb />
        <h1 className="text-3xl font-semibold">Build New Bundle</h1>
      </div>

      {!mounted ? (
        // Render a loading state or null until the component is mounted
        <div>Loading...</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bundle-name">Bundle Name</Label>
                <Input
                  id="bundle-name"
                  placeholder="Enter bundle name here"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Add fields for Price, Discount, Images */}
              <div>
                <Label htmlFor="bundle-price">Price (₦)</Label>
                <Input
                  id="bundle-price"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 15500.00"
                  {...register("price")}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="bundle-discount">Discount (%)</Label>
                <Input
                  id="bundle-discount"
                  type="number"
                  step="1"
                  placeholder="e.g., 5"
                  {...register("discount")}
                />
                {errors.discount && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.discount.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="bundle-image">Bundle Image(s)</Label>
                <Input
                  id="bundle-image"
                  type="file"
                  accept="image/*"
                  {...register("bundle_image")}
                />
                {errors.bundle_image && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.bundle_image.message as string}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products in Bundle</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddProductsClick}
                className="mb-4"
              >
                + Add Products
              </Button>

              {/* Product List Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    {/* Column for Remove icon */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundleProducts.length > 0 ? (
                    bundleProducts.map((product) => (
                      <TableRow key={product.id}>
                        {" "}
                        {/* Use product.id */}
                        <TableCell className="flex items-center gap-3">
                          {/* Assuming product has an image_url and name */}
                          {product.images?.[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.name || "Product image"}
                              width={40}
                              height={40}
                              className="rounded"
                            /> // Use first image from images array
                          )}
                          {product.name || "Unknown Product"}
                        </TableCell>
                        <TableCell>{formatNaira(product.price || 0)}</TableCell>
                        {/* Use formatNaira */}
                        {/* Assuming product has a stock_status */}
                        <TableCell>
                          <span
                            className={`
                              ${
                                product.stock_status === "in_stock"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                              px-2 py-1 rounded-full text-xs font-medium
                            `}
                          >
                            {product.stock_status?.replace(/_/g, " ") ||
                              "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProduct(product.id)}
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No products added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Build Bundle Button */}
          <div className="flex justify-end mt-6">
            <Button
              className="bg-[#1B6013] hover:bg-[#1B6013]/90"
              onClick={handleSubmit(onSubmit)}
              disabled={createBundleMutation.isPending}
            >
              {createBundleMutation.isPending ? "Building..." : "Build Bundle"}
            </Button>
          </div>
        </form>
      )}

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onSubmit={handleProductsSelected}
        existingProductIds={bundleProducts.map((product) => product.id)}
      />
    </div>
  );
}
