"use server";

import { createClient } from "src/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addProductAction(productData: any) {
  console.log('[DEBUG] ADD PRODUCT SERVER ACTION CALLED!');
  console.log('[DEBUG] Received productData:', JSON.stringify(productData, null, 2));
  
  const supabase = await createClient();

  // Helper: derive realistic list price with randomness to avoid identical discounts
  const deriveListPrice = (price: number | null | undefined) => {
    if (typeof price !== "number" || !isFinite(price) || price <= 0) return null;
    
    let baseMarkup, minMarkup, maxMarkup;
    if (price <= 1000) {
      baseMarkup = 1.5; minMarkup = 1.3; maxMarkup = 1.7; // 30-70% markup
    } else if (price <= 5000) {
      baseMarkup = 1.35; minMarkup = 1.2; maxMarkup = 1.5; // 20-50% markup
    } else if (price <= 15000) {
      baseMarkup = 1.25; minMarkup = 1.15; maxMarkup = 1.35; // 15-35% markup
    } else {
      baseMarkup = 1.15; minMarkup = 1.05; maxMarkup = 1.25; // 5-25% markup
    }
    
    // Add randomness: ±15% variation from base markup
    const variation = (Math.random() - 0.5) * 0.3; // -15% to +15%
    const randomMarkup = baseMarkup + (baseMarkup * variation);
    
    // Ensure within reasonable bounds
    const finalMarkup = Math.max(minMarkup, Math.min(maxMarkup, randomMarkup));
    
    const marked = price * finalMarkup;
    return Math.round(marked / 50) * 50;
  };
  
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
        const rawOptions = Array.isArray(productData[field]) 
          ? productData[field] 
          : [];
        // Ensure each variation option has a list_price
        cleanData[field] = rawOptions.map((opt: any) => {
          const price = typeof opt?.price === "number" ? opt.price : null;
          const list_price =
            typeof opt?.list_price === "number" && isFinite(opt.list_price) && opt.list_price > 0
              ? opt.list_price
              : deriveListPrice(price);
        
          return { ...opt, list_price };
        });
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

  // If no variations and list_price is missing/invalid, derive from price
  if (!Array.isArray(cleanData.options) || cleanData.options.length === 0) {
    const hasValidPrice = typeof cleanData.price === "number" && isFinite(cleanData.price) && cleanData.price > 0;
    const hasValidListPrice = typeof cleanData.list_price === "number" && isFinite(cleanData.list_price) && cleanData.list_price > 0;
    if (hasValidPrice && !hasValidListPrice) {
      cleanData.list_price = deriveListPrice(cleanData.price);
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
