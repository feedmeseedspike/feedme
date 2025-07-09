"use server";

import { createClient } from "src/utils/supabase/server";
import { revalidatePath } from "next/cache";


export async function updateProductAction(productId: string, productData: any) {
  // console.log('[DEBUG] SERVER ACTION CALLED!');
  // console.log('[DEBUG] productId:', productId);
  
  // Debug log for full productData
  // console.log('[DEBUG] Received productData:', JSON.stringify(productData, null, 2));
  // Debug log for options
  // console.log('[DEBUG] options type:', typeof productData.options, Array.isArray(productData.options), productData.options);
  
  // Ensure options is a valid JSON array of plain objects
  if (Array.isArray(productData.options)) {
    // console.log('[DEBUG] Processing options array with length:', productData.options.length);
    productData.options = await Promise.all(productData.options.map(async (opt: any, index: number) => {
      // console.log(`[DEBUG] Processing option ${index}:`, opt);
      const { name, price, stock_status, image } = opt;
      
      // Handle image upload if it's a File object
      let imageUrl = image;
      if (image instanceof File) {
        // console.log(`[DEBUG] Uploading image for option ${index}`);
        imageUrl = await uploadProductImageAction(image, "option-images");
        // console.log(`[DEBUG] Uploaded image URL for option ${index}:`, imageUrl);
      }
      
      const processedOption = {
        name,
        price,
        stock_status,
        image: typeof imageUrl === 'string' ? imageUrl : null
      };
      // console.log(`[DEBUG] Processed option ${index}:`, processedOption);
      return processedOption;
    }));
    // console.log('[DEBUG] Final processed options:', productData.options);
  } else {
    // console.log('[DEBUG] Options is not an array or is null/undefined');
  }
  
  const supabase = await createClient();
  // console.log('[DEBUG] About to update product in DB with:', JSON.stringify(productData, null, 2));
  const { data, error } = await supabase
    .from("products")
    .update(productData)
    .eq("id", productId)
    .select();
  // console.log('[DEBUG] Supabase update result:', JSON.stringify({ data, error }, null, 2));
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/edit/${productId}`);
  return data?.[0];
}

export async function uploadProductImageAction(file: File, bucketName: string = "product-images") {
  // console.log('[DEBUG] UPLOAD ACTION CALLED!');
  // console.log('[DEBUG] file:', file.name, file.size);
  // console.log('[DEBUG] bucketName:', bucketName);
  
  const supabase = await createClient();
  const fileExt = file.name.split(".").pop();
  const filePath = `${Date.now()}.${fileExt}`;
  // console.log('[DEBUG] filePath:', filePath);
  
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);
  if (error) throw new Error(error.message);
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  // console.log('[DEBUG] Uploaded URL:', publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
} 