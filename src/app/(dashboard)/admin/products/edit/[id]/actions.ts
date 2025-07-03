"use server";

import { createClient } from "src/utils/supabase/server";
import { revalidatePath } from "next/cache";

console.log('[DEBUG] actions.ts loaded');

export async function updateProductAction(productId: string, productData: any) {
  console.log('[DEBUG] updateProductAction called for productId:', productId);
  // Debug log for options
  console.log('[DEBUG] options type:', typeof productData.options, Array.isArray(productData.options), productData.options);
  // Ensure options is a valid JSON array of plain objects
  if (Array.isArray(productData.options)) {
    productData.options = productData.options.map((opt: any) => {
      const { name, price, stockStatus, stock_status, image } = opt;
      return {
        name,
        price,
        stock_status: stock_status || (stockStatus === 'In Stock' ? 'in_stock' : 'out_of_stock'),
        image: typeof image === 'string' ? image : null
      };
    });
    console.log('[DEBUG] Final options array to save:', JSON.stringify(productData.options, null, 2));
  }
  console.log('[DEBUG] updateProductAction received:', JSON.stringify(productData, null, 2));
  const supabase = createClient();
  console.log('[DEBUG] About to update product in DB...');
  const { data, error } = await supabase
    .from("products")
    .update(productData)
    .eq("id", productId)
    .select();
  console.log('[DEBUG] updateProductAction result:', JSON.stringify(data, null, 2), error);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/edit/${productId}`);
  return data?.[0];
}

export async function uploadProductImageAction(file: File, bucketName: string = "product-images") {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const filePath = `${Date.now()}.${fileExt}`;
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);
  if (error) throw new Error(error.message);
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  return publicUrlData.publicUrl;
} 