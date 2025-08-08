"use server";

import { createClient } from "src/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addOfferAction(offerData: any) {
  console.log('[DEBUG] ADD OFFER SERVER ACTION CALLED!');
  console.log('[DEBUG] Received offerData:', JSON.stringify(offerData, null, 2));
  
  const supabase = await createClient();
  
  // Ensure we only send allowed database fields
  const allowedFields = [
    "title",
    "description",
    "image_url",
    "price_per_slot",
    "total_slots",
    "available_slots",
    "weight_per_slot",
    "end_date",
    "category"
  ];
  
  const cleanData: any = {};
  for (const field of allowedFields) {
    if (field in offerData) {
      cleanData[field] = offerData[field];
    }
  }
  
  console.log('[DEBUG] About to insert offer in DB with:', JSON.stringify(cleanData, null, 2));
  
  const { data, error } = await supabase
    .from("offers")
    .insert([cleanData])
    .select();
    
  console.log('[DEBUG] Supabase insert result:', JSON.stringify({ data, error }, null, 2));
  
  if (error) {
    console.error('[ERROR] Supabase insert error:', error);
    throw new Error(error.message);
  }
  
  // Revalidate relevant paths
  revalidatePath("/admin/offers");
  return data?.[0];
}

export async function updateOfferAction(offerId: string, offerData: any) {
  console.log('[DEBUG] UPDATE OFFER SERVER ACTION CALLED!');
  console.log('[DEBUG] Received offerData:', JSON.stringify(offerData, null, 2));
  
  const supabase = await createClient();
  
  // Ensure we only send allowed database fields
  const allowedFields = [
    "title",
    "description",
    "image_url",
    "price_per_slot",
    "total_slots",
    "available_slots",
    "weight_per_slot",
    "end_date",
    "category",
    "status"
  ];
  
  const cleanData: any = {};
  for (const field of allowedFields) {
    if (field in offerData) {
      cleanData[field] = offerData[field];
    }
  }
  
  // Always update the updated_at timestamp
  cleanData.updated_at = new Date().toISOString();
  
  console.log('[DEBUG] About to update offer in DB with:', JSON.stringify(cleanData, null, 2));
  
  const { data, error } = await supabase
    .from("offers")
    .update(cleanData)
    .eq("id", offerId)
    .select();
    
  console.log('[DEBUG] Supabase update result:', JSON.stringify({ data, error }, null, 2));
  
  if (error) {
    console.error('[ERROR] Supabase update error:', error);
    throw new Error(error.message);
  }
  
  // Revalidate relevant paths
  revalidatePath("/admin/offers");
  return data?.[0];
}

export async function uploadOfferImageAction(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('file') as File;
  const bucketName = formData.get('bucketName') as string || "offer-images";
  
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