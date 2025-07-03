"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@components/ui/table";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import AddProductModal from "@components/admin/addProductModal";
import { Tables } from "@utils/database.types";
import { formatNaira } from "src/lib/utils";
import { useToast } from "../../../../../../hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBundleWithProducts } from "../../../../../../queries/bundles";
import CustomBreadcrumb from "@components/shared/breadcrumb";

const EditBundleSchema = z.object({
  name: z.string().min(1, "Bundle name is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  discount: z.coerce.number().min(0).max(100).optional().nullable(),
  bundle_image: z.instanceof(FileList).optional(),
});

type EditBundleFormValues = z.infer<typeof EditBundleSchema>;

export default function EditBundleClient({
  initialBundle,
  allProducts,
}: {
  initialBundle: any;
  allProducts: Tables<"products">[];
}) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [bundleProducts, setBundleProducts] = useState<Tables<"products">[]>(
    initialBundle.products || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditBundleFormValues>({
    resolver: zodResolver(EditBundleSchema),
    defaultValues: {
      name: initialBundle.name || "",
      price: initialBundle.price || 0,
      discount: initialBundle.discount_percentage || undefined,
    },
  });

  useEffect(() => {
    reset({
      name: initialBundle.name || "",
      price: initialBundle.price || 0,
      discount: initialBundle.discount_percentage || undefined,
    });
    setBundleProducts(
      Array.isArray(initialBundle.products) ? initialBundle.products : []
    );
  }, [initialBundle, reset]);

  const updateBundleMutation = useMutation({
    mutationFn: updateBundleWithProducts,
    onSuccess: () => {
      showToast("Bundle updated successfully.", "success");
      queryClient.invalidateQueries({
        queryKey: ["bundle", initialBundle.id] as const,
      });
      queryClient.invalidateQueries({ queryKey: ["bundles"] as const });
    },
    onError: (error: any) => {
      console.error("Error updating bundle:", error);
      showToast(`Failed to update bundle: ${error.message}`, "error");
    },
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

  const onSubmit = (data: EditBundleFormValues) => {
    if (bundleProducts.length === 0) {
      showToast("Please add at least one product to the bundle.", "error");
      return;
    }
    updateBundleMutation.mutate({
      id: initialBundle.id,
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
        <h1 className="text-3xl font-semibold">
          Edit Bundle: {initialBundle.name}
        </h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bundle Information</CardTitle>
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
          disabled={updateBundleMutation.status === "pending"}
        >
          {updateBundleMutation.status === "pending"
            ? "Saving..."
            : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
