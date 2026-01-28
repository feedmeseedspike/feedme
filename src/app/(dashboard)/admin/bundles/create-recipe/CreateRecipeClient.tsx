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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Trash2, Video, ChefHat, Clock, Gauge } from "lucide-react";
import Image from "next/image";
import AddProductModal from "@components/admin/addProductModal";
import { Tables } from "@utils/database.types";
import { formatNaira } from "src/lib/utils";
import { useToast } from "src/hooks/useToast";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import { createRecipeBundleAction, uploadBundleImageAction } from "./actions";
import { RichTextEditor } from "@components/ui/rich-text-editor";

const CreateRecipeSchema = z.object({
  name: z.string().min(1, "Recipe Name is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  // New Recipe Fields
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  chefName: z.string().optional(),
  // Image
  bundle_image: z.instanceof(FileList).optional(),
});

type CreateRecipeFormValues = z.infer<typeof CreateRecipeSchema>;

export default function CreateRecipeClient({
  allProducts,
}: {
  allProducts: Tables<"products">[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [bundleProducts, setBundleProducts] = useState<Tables<"products">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState("");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRecipeFormValues>({
    resolver: zodResolver(CreateRecipeSchema),
    defaultValues: {
      name: "",
      price: 0,
      videoUrl: "",
      chefName: "",
    }
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

  // Helper function to get the correct price display for products
  const getProductPriceDisplay = (product: Tables<"products">) => {
    if ((product as any).selectedOption && product.options && Array.isArray(product.options)) {
      const selectedOption = product.options.find((opt: any) => opt.name === (product as any).selectedOption);
      if (selectedOption && (selectedOption as any).price) {
        return (selectedOption as any).price;
      }
    }
    if (product.price && product.price > 0) {
      return product.price;
    }
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

  const onSubmit = async (data: CreateRecipeFormValues) => {
    if (bundleProducts.length === 0) {
      showToast("Please add at least one ingredient/product.", "error");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let thumbnail = null;
      if (data.bundle_image && data.bundle_image.length > 0) {
        const formData = new FormData();
        formData.append('file', data.bundle_image[0]);
        formData.append('bucketName', 'bundle-thumbnails');
        thumbnail = await uploadBundleImageAction(formData);
      }

      const productIds = bundleProducts.map((p) => (p as any).originalId || p.id);
      
      await createRecipeBundleAction({
        name: data.name,
        price: data.price,
        description: description,
        thumbnail,
        productIds: productIds,
        // Recipe specific
        videoUrl: data.videoUrl,
        chefName: data.chefName,
      });
      
      showToast("Recipe created successfully!", "success");
      router.push("/admin/bundles");
    } catch (error: any) {
      console.error("Error creating recipe:", error);
      showToast(`Failed to create recipe: ${error.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen font-custom">
      <div className="mb-12 border-b border-gray-100 pb-8">
        <CustomBreadcrumb />
        <div className="flex items-center gap-6 mt-6">
            <div className="w-16 h-16 rounded-3xl bg-[#1B6013] flex items-center justify-center text-[#D9FF00] shadow-2xl shadow-green-100">
               <Video className="w-8 h-8"/>
            </div>
            <div>
               <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter">New Social Masterclass</h1>
               <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Transform social trends into shoppable experiences</p>
            </div>
        </div>
      </div>

      {!mounted ? (
        <div>Loading...</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl mx-auto">
          
          {/* 1. Recipe Context Section */}
          <Card className="border-t-4 border-t-[#1B6013] shadow-md">
            <CardHeader className="bg-white">
              <CardTitle className="text-xl flex items-center gap-2">
                 1. The &quot;Hook&quot; (Social Context)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Video URL */}
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl" className="flex items-center gap-2 font-medium">
                        <Video size={16}/> Social Video Link (TikTok/X)
                    </Label>
                    <Input
                      id="videoUrl"
                      placeholder="e.g. https://x.com/chef_tolu/status/..."
                      {...register("videoUrl")}
                      className="bg-gray-50 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]"
                    />
                     <p className="text-xs text-muted-foreground">This video will play at the top of the recipe page.</p>
                     {errors.videoUrl && (
                      <p className="text-red-500 text-sm">{errors.videoUrl.message}</p>
                    )}
                  </div>

                  {/* Chef Name */}
                  <div className="space-y-2">
                    <Label htmlFor="chefName" className="flex items-center gap-2 font-medium">
                        <ChefHat size={16}/> Creator / Chef Name
                    </Label>
                    <Input
                      id="chefName"
                      placeholder="e.g. Chef Tolu"
                      {...register("chefName")}
                    />
                  </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Bundle Details */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">2. Recipe Bundle Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="bundle-name" className="font-medium">Recipe Name / Title</Label>
                    <Input
                    id="bundle-name"
                    placeholder="e.g. Spicy Jollof Rice Bundle"
                    {...register("name")}
                    className="font-semibold text-lg"
                    />
                    {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                </div>
                <div>
                    <Label htmlFor="bundle-price" className="font-medium">Total Bundle Price (₦)</Label>
                    <Input
                    id="bundle-price"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 15500.00"
                    {...register("price")}
                    />
                    {errors.price && (
                    <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                    )}
                </div>
              </div>

              <div>
                <Label className="font-medium mb-2 block">Cover Image (The &quot;Basket&quot; Shot)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <Input
                        id="bundle-img"
                        type="file"
                        accept="image/*"
                        className="hidden" // hidden input, style label or custom trigger if needed, but Input styles might override hidden. 
                        // Standard Input type=file doesn't support 'hidden' class well directly often without wrapper.
                        // I'll leave standard Input for now but styling it lightly.
                        {...register("bundle_image")}
                    />
                    {/* Re-using standard input style for simplicity for now as Input component styling is opaque */}
                     <p className="text-sm text-gray-500 mt-2">Upload the &apos;Basket&apos; image here</p>
                </div>
                {errors.bundle_image && (
                  <p className="text-red-500 text-sm mt-1">{errors.bundle_image.message}</p>
                )}
              </div>

               <div className="pt-2">
                <RichTextEditor
                  label="Description / Instructions"
                  value={description}
                  onChange={setDescription}
                  placeholder="Tell the story of this meal..."
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. Products */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex justify-between items-center">
                <span>3. Ingredients (The Bundle)</span>
                <Button
                    type="button"
                    onClick={handleAddProductsClick}
                    className="bg-[#1B6013] text-white"
                >
                    + Add Ingredients
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddProductModal
                isOpen={isAddProductModalOpen}
                onClose={() => setIsAddProductModalOpen(false)}
                onSubmit={handleProductsSelected}
                existingProductIds={bundleProducts.map((p) => p.id)}
                allProducts={allProducts}
              />
              <div className="overflow-x-auto rounded-md border text-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Image</TableHead>
                      <TableHead>Ingredient Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bundleProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                           Ingredients list is empty. Add products to build the bundle.
                        </TableCell>
                      </TableRow>
                    ) : (
                      bundleProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {Array.isArray(product.images) && product.images.length > 0 ? (
                              <div className="w-10 h-10 relative rounded overflow-hidden">
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-200" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                          </TableCell>
                          <TableCell>{formatNaira(getProductPriceDisplay(product))}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
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

          <div className="flex justify-end gap-4 pb-12">
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                className="w-32"
            >
                Cancel
            </Button>
            <Button
                type="submit"
                className="bg-[#1B6013] text-white w-48 text-lg hover:bg-[#144d0f]"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Creating..." : "Publish Recipe"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
