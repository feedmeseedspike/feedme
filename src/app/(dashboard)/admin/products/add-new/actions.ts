"use server";

import { createClient } from "src/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addProductAction(productData: any) {
  console.log('[DEBUG] ADD PRODUCT SERVER ACTION CALLED!');
  console.log('[DEBUG] Received productData:', JSON.stringify(productData, null, 2));
  
  const supabase = await createClient();
  
  // Ensure we only send allowed database fields
  const allowedFields = [
    "name",
    "slug", 
    "description",
    "price",
    "list_price",
    "stock_status",
    "is_published",
    "category_ids",
    "images",
    "options",
    "in_season"
  ];
  
  const cleanData: any = {};
  for (const field of allowedFields) {
    if (field in productData) {
      // Special handling for specific fields
      if (field === "options") {
        // Ensure options is properly serialized JSON
        cleanData[field] = Array.isArray(productData[field]) 
          ? productData[field] 
          : [];
      } else if (field === "images") {
        // Ensure images is an array of strings
        cleanData[field] = Array.isArray(productData[field]) 
          ? productData[field].filter((img: any) => typeof img === "string")
          : [];
      } else if (field === "category_ids") {
        // Ensure category_ids is an array of strings
        cleanData[field] = Array.isArray(productData[field]) 
          ? productData[field]
          : [];
      } else {
        cleanData[field] = productData[field];
      }
    }
  }
  
  console.log('[DEBUG] About to insert product in DB with:', JSON.stringify(cleanData, null, 2));
  
  const { data, error } = await supabase
    .from("products")
    .insert([cleanData])
    .select();
    
  console.log('[DEBUG] Supabase insert result:', JSON.stringify({ data, error }, null, 2));
  
  if (error) {
    console.error('[ERROR] Supabase insert error:', error);
    throw new Error(error.message);
  }
  
  // Revalidate relevant paths
  revalidatePath("/admin/products");
  return data?.[0];
}

export async function uploadProductImageAction(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('file') as File;
  const bucketName = formData.get('bucketName') as string || "product-images";
  
  if (!file) throw new Error('No file provided');
  
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
