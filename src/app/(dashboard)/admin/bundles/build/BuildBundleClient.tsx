"use client";

import React, { useState } from "react";
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
import { Trash2 } from "lucide-react";
import Image from "next/image";
import AddProductModal from "@components/admin/addProductModal";
import { Tables } from "@utils/database.types";
import { formatNaira } from "src/lib/utils";
import { useToast } from "../../../../../hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBundleWithProducts } from "../../../../../queries/bundles";
import CustomBreadcrumb from "@components/shared/breadcrumb";

const BuildBundleSchema = z.object({
  name: z.string().min(1, "Bundle name is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  discount: z.coerce.number().min(0).max(100).optional(),
  bundle_image: z.instanceof(FileList).optional(),
});

type BuildBundleFormValues = z.infer<typeof BuildBundleSchema>;

export default function BuildBundleClient({
  allProducts,
}: {
  allProducts: Tables<"products">[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [bundleProducts, setBundleProducts] = useState<Tables<"products">[]>(
    []
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BuildBundleFormValues>({
    resolver: zodResolver(BuildBundleSchema),
  });

  const handleAddProductsClick = () => {
    setIsAddProductModalOpen(true);
  };

  const handleProductsSelected = (selectedProducts: Tables<"products">[]) => {
    setBundleProducts((prevProducts) => {
      const newProducts = selectedProducts.filter(
        (newProduct) =>
          !prevProducts.some(
            (existingProduct) => existingProduct.id === newProduct.id
          )
      );
      return [...prevProducts, ...newProducts];
    });
    setIsAddProductModalOpen(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setBundleProducts(
      bundleProducts.filter((product) => product.id !== productId)
    );
  };

  const createBundleMutation = useMutation({
    mutationFn: createBundleWithProducts,
    onSuccess: () => {
      showToast("Bundle created successfully.", "success");
      router.push("/admin/bundles");
      queryClient.invalidateQueries({ queryKey: ["bundles"] as const });
    },
    onError: (error: any) => {
      console.error("Error creating bundle:", error);
      showToast(`Failed to create bundle: ${error.message}`, "error");
    },
  });

  const onSubmit = (data: BuildBundleFormValues) => {
    if (bundleProducts.length === 0) {
      showToast("Please add at least one product to the bundle.", "error");
      return;
    }
    createBundleMutation.mutate({
      name: data.name,
      price: data.price,
      discount: data.discount,
      imageFile: data.bundle_image?.[0],
      productIds: bundleProducts.map((p) => p.id),
    });
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <CustomBreadcrumb />
        <h1 className="text-3xl font-semibold">Build New Bundle</h1>
      </div>
      {!mounted ? (
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
                    {errors.bundle_image.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Bundle Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                onClick={handleAddProductsClick}
                className="mb-4"
              >
                + Add Products
              </Button>
              <AddProductModal
                isOpen={isAddProductModalOpen}
                onClose={() => setIsAddProductModalOpen(false)}
                onSubmit={handleProductsSelected}
                existingProductIds={bundleProducts.map((p) => p.id)}
              />
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bundleProducts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-gray-400"
                        >
                          No products added to this bundle yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      bundleProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {Array.isArray(product.images) &&
                            product.images.length > 0 ? (
                              <div className="w-12 h-12 relative rounded-md overflow-hidden">
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-gray-200" />
                            )}
                          </TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{formatNaira(product.price)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveProduct(product.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <Button
            type="submit"
            className="bg-[#1B6013] text-white"
            disabled={createBundleMutation.status === "pending"}
          >
            {createBundleMutation.status === "pending"
              ? "Creating..."
              : "Create Bundle"}
          </Button>
        </form>
      )}
    </div>
  );
}
