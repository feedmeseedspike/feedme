"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import { updateBundleAction, uploadBundleImageAction } from "../../build/actions";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import { RichTextEditor } from "@components/ui/rich-text-editor";

const EditBundleSchema = z.object({
  name: z.string().min(1, "Bundle name is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
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
  const router = useRouter();
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [bundleProducts, setBundleProducts] = useState<Tables<"products">[]>(
    initialBundle.products || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState(initialBundle.description || "");

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
    },
  });

  useEffect(() => {
    reset({
      name: initialBundle.name || "",
      price: initialBundle.price || 0,
    });
    setDescription(initialBundle.description || "");
    const products = Array.isArray(initialBundle.products) ? initialBundle.products : [];
    setBundleProducts(products);
  }, [initialBundle, reset]);

  // Function to handle bundle update with image upload
  const updateBundleWithProducts = async (data: {
    id: string;
    name: string;
    price: number;
    description?: string;
    imageFile?: File;
    productIds: string[];
  }) => {
    let thumbnail = null;
    
    // Upload image if provided, otherwise keep existing image
    if (data.imageFile) {
      const formData = new FormData();
      formData.append('file', data.imageFile);
      formData.append('bucketName', 'bundle-thumbnails');
      thumbnail = await uploadBundleImageAction(formData);
    } else if (initialBundle.thumbnail_url) {
      // Keep existing image
      thumbnail = { url: initialBundle.thumbnail_url };
    }
    
    // Update the bundle
    return await updateBundleAction({
      id: data.id,
      name: data.name,
      price: data.price,
      description: data.description,
      thumbnail,
      productIds: data.productIds,
    });
  };

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
      bundleProducts.filter((product) => 
        product.id !== productId && ((product as any).originalId || product.id) !== productId
      )
    );
  };

  // Helper function to get the correct price display for products
  const getProductPriceDisplay = (product: Tables<"products">) => {
    // If product has a selected option, use that option's price
    if ((product as any).selectedOption && product.options && Array.isArray(product.options)) {
      const selectedOption = product.options.find((opt: any) => opt.name === (product as any).selectedOption);
      if (selectedOption && (selectedOption as any).price) {
        return (selectedOption as any).price;
      }
    }

    // If product has a base price, use it
    if (product.price && product.price > 0) {
      return product.price;
    }
    
    // If product has options, show the minimum price
    if (product.options && Array.isArray(product.options) && product.options.length > 0) {
      const prices = product.options
        .map((option: any) => option.price)
        .filter((price: any) => typeof price === 'number' && price > 0);
      
      if (prices.length > 0) {
        return Math.min(...prices);
      }
    }
    
    return 0;
  };

  const onSubmit = async (data: EditBundleFormValues) => {
    if (bundleProducts.length === 0) {
      showToast("Please add at least one product to the bundle.", "error");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const productIds = bundleProducts.map((p) => (p as any).originalId || p.id);
      
      // Validate UUID format before sending to server
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidIds = productIds.filter(id => !uuidRegex.test(id));
      
      if (invalidIds.length > 0) {
        console.error('Invalid product IDs detected:', invalidIds);
        console.error('Bundle products with invalid IDs:', bundleProducts.filter(p => invalidIds.includes(p.id)));
        showToast(`Invalid product IDs detected: ${invalidIds.join(', ')}`, "error");
        return;
      }
      
      const updateData = {
        id: initialBundle.id,
        name: data.name,
        price: data.price,
        description: description,
        imageFile: data.bundle_image?.[0],
        productIds: productIds,
      };
      
      console.log('Updating bundle with data:', updateData);
      
      await updateBundleWithProducts(updateData);
      
      showToast("Bundle updated successfully.", "success");
      router.push("/admin/bundles");
    } catch (error: any) {
      console.error("Error updating bundle:", error);
      showToast(`Failed to update bundle: ${error.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
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
              <RichTextEditor
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Enter bundle description with rich text formatting..."
              />
            </div>
            <div>
              <Label htmlFor="bundle-image">Bundle Image(s)</Label>
              {initialBundle.thumbnail_url && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">Current image:</p>
                  <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                    <Image
                      src={initialBundle.thumbnail_url}
                      alt={initialBundle.name || "Bundle image"}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              <Input
                id="bundle-image"
                type="file"
                accept="image/*"
                {...register("bundle_image")}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to keep current image, or select a new image to replace it.
              </p>
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
              existingProductIds={bundleProducts.map((p) => (p as any).originalId || p.id)}
              allProducts={allProducts}
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
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {(product as any).selectedOption && (
                              <div className="text-xs text-gray-500">
                                Option: {(product as any).selectedOption}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatNaira(getProductPriceDisplay(product))}</TableCell>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
