"use server";

import { createClient } from "src/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProductAction(productId: string, productData: any) {
  console.log('[DEBUG] SERVER ACTION CALLED!');
  console.log('[DEBUG] productId:', productId);
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
        // Handle both array (legacy variations) and object (new structure with customizations)
        if (Array.isArray(productData[field])) {
          cleanData[field] = productData[field];
        } else if (productData[field] && typeof productData[field] === "object") {
          cleanData[field] = productData[field];
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

  // Handle related products
  if (productData.related_products && Array.isArray(productData.related_products)) {
    console.log('[DEBUG] Updating related products:', productData.related_products);
    
    // 1. Delete existing relations
    const { error: deleteError } = await supabase
      .from('product_relations')
      .delete()
      .eq('source_product_id', productId);
      
    if (deleteError) {
      console.error('[ERROR] Failed to delete existing relations:', deleteError);
    } else {
      // 2. Insert new relations
      if (productData.related_products.length > 0) {
        const relationsToInsert = productData.related_products.map((targetId: string) => ({
          source_product_id: productId,
          target_product_id: targetId,
          relation_type: 'related'
        }));
        
        const { error: insertError } = await supabase
          .from('product_relations')
          .insert(relationsToInsert);
          
        if (insertError) {
          console.error('[ERROR] Failed to insert new relations:', insertError);
        }
      }
    }
  }
  
  // Revalidate relevant paths
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/edit/${productId}`);
  return data?.[0];
}

export async function uploadProductImageAction(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("file") as File;
  const bucketName = (formData.get("bucketName") as string) || "product-images";
  
  if (!file) {
    throw new Error("No file provided");
  }

  const fileExt = file.name.split(".").pop();
  const filePath = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);
    
  if (error) throw new Error(error.message);
  
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
    
  return publicUrlData.publicUrl;
}
