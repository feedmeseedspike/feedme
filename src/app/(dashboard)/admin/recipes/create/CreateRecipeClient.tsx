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
import { Trash2, Video, ChefHat } from "lucide-react";
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
    return 0;
  };

  const onSubmit = async (data: CreateRecipeFormValues) => {
    if (bundleProducts.length === 0) {
      showToast("Please add at least one ingredient.", "error");
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
        videoUrl: data.videoUrl,
        chefName: data.chefName,
      });
      
      showToast("Recipe created successfully!", "success");
      router.push("/admin/recipes");
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
          
          <Card className="border-t-4 border-t-[#1B6013] shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">1. Social Hook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl" className="font-medium flex items-center gap-2"><Video size={16}/> Social Link</Label>
                    <Input id="videoUrl" placeholder="TikTok/X URL" {...register("videoUrl")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chefName" className="font-medium flex items-center gap-2"><ChefHat size={16}/> Creator Name</Label>
                    <Input id="chefName" placeholder="e.g. Chef Tolu" {...register("chefName")} />
                  </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">2. Recipe Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="name" className="font-medium">Title</Label>
                    <Input id="name" {...register("name")} className="font-bold" />
                </div>
                <div>
                    <Label htmlFor="price" className="font-medium">Total Price (₦)</Label>
                    <Input id="price" type="number" step="0.01" {...register("price")} />
                </div>
              </div>
              <div>
                <Label className="font-medium mb-2 block">Cover Image</Label>
                <Input type="file" accept="image/*" {...register("bundle_image")} />
              </div>
               <div className="pt-2">
                <RichTextEditor
                  label="Instructions"
                  value={description}
                  onChange={setDescription}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex justify-between items-center">
                <span>3. Ingredients</span>
                <Button type="button" onClick={handleAddProductsClick} className="bg-[#1B6013] text-white">+ Add Products</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AddProductModal
                isOpen={isAddProductModalOpen}
                onClose={() => setIsAddProductModalOpen(false)}
                onSubmit={handleProductsSelected}
                existingProductIds={bundleProducts.map((p) => p.id)}
                allProducts={allProducts}
              />
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
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">No ingredients added.</TableCell></TableRow>
                  ) : (
                    bundleProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.images?.[0] && <div className="w-10 h-10 relative overflow-hidden rounded"><Image src={product.images[0]} alt={product.name} fill className="object-cover" /></div>}
                        </TableCell>
                        <TableCell className="font-bold">{product.name}</TableCell>
                        <TableCell>{formatNaira(getProductPriceDisplay(product))}</TableCell>
                        <TableCell><Button type="button" variant="ghost" className="text-red-500" onClick={() => handleRemoveProduct(product.id)}><Trash2 size={16}/></Button></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pb-12">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="bg-[#1B6013] text-white w-48" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Publish Recipe"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
