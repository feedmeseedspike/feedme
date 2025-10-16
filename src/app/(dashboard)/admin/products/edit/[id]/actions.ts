"use server";

import { createClient } from "src/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProductAction(productId: string, productData: any) {
  console.log('[DEBUG] SERVER ACTION CALLED!');
  console.log('[DEBUG] productId:', productId);
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
        // Handle both array (legacy variations) and object (new structure with customizations)
        if (Array.isArray(productData[field])) {
          // Ensure each variation option has a list_price
          cleanData[field] = productData[field].map((opt: any) => {
            const price = typeof opt?.price === "number" ? opt.price : null;
            const list_price =
              typeof opt?.list_price === "number" && isFinite(opt.list_price) && opt.list_price > 0
                ? opt.list_price
                : deriveListPrice(price);
            return { ...opt, list_price };
          });
        } else if (productData[field] && typeof productData[field] === "object") {
          const obj = productData[field];
          const variations = Array.isArray(obj.variations)
            ? obj.variations.map((opt: any) => {
                const price = typeof opt?.price === "number" ? opt.price : null;
                const list_price =
                  typeof opt?.list_price === "number" && isFinite(opt.list_price) && opt.list_price > 0
                    ? opt.list_price
                    : deriveListPrice(price);
                return { ...opt, list_price };
              })
            : undefined;
          cleanData[field] = { ...obj, ...(variations ? { variations } : {}) };
        } else {
          cleanData[field] = null;
        }
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

  // If base price is being reduced and list_price not set explicitly,
  // set list_price to previous price value
  try {
    const { data: existingProducts } = await supabase
      .from("products")
      .select("price, list_price, options")
      .eq("id", productId)
      .limit(1);
    const prev = existingProducts?.[0];
    const prevPrice: number | null = typeof prev?.price === "number" ? prev.price : null;
    const nextPrice: number | null = typeof cleanData?.price === "number" ? cleanData.price : null;
    const listPriceProvided = Object.prototype.hasOwnProperty.call(productData, "list_price");

    if (
      prevPrice !== null &&
      nextPrice !== null &&
      isFinite(prevPrice) &&
      isFinite(nextPrice) &&
      nextPrice < prevPrice &&
      !listPriceProvided
    ) {
      cleanData.list_price = prevPrice;
    }

    // If no variations and list_price missing/invalid, derive from price
    const hasValidPrice = typeof cleanData.price === "number" && isFinite(cleanData.price) && cleanData.price > 0;
    const hasValidListPrice = typeof cleanData.list_price === "number" && isFinite(cleanData.list_price) && cleanData.list_price > 0;
    if (hasValidPrice && !hasValidListPrice) {
      cleanData.list_price = deriveListPrice(cleanData.price);
    }
  } catch (_) {
    // Non-fatal: proceed without auto-backfilling
  }
  
  console.log('[DEBUG] About to update product in DB with:', JSON.stringify(cleanData, null, 2));
  
  const { data, error } = await supabase
    .from("products")
    .update(cleanData)
    .eq("id", productId)
    .select();
    
  console.log('[DEBUG] Supabase update result:', JSON.stringify({ data, error }, null, 2));
  
  if (error) {
    console.error('[ERROR] Supabase update error:', error);
    throw new Error(error.message);
  }
  
  // Revalidate relevant paths
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/edit/${productId}`);
  return data?.[0];
}

export async function uploadProductImageAction(file: File, bucketName: string = "product-images") {
  const supabase = await createClient();
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