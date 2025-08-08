"use server";

import { createClient } from "src/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addCategoryAction(categoryData: any) {

  const supabase = await createClient();
  
  // Ensure we only send allowed database fields
  const allowedFields = [
    "title",
    "description",
    "tags",
    "keynotes", 
    "thumbnail",
    "banner_url"
  ];
  
  const cleanData: any = {};
  for (const field of allowedFields) {
    if (field in categoryData) {
      cleanData[field] = categoryData[field];
    }
  }
  
  
  const { data, error } = await supabase
    .from("categories")
    .insert([cleanData])
    .select();
    
  
  if (error) {
    console.error('[ERROR] Supabase insert error:', error);
    throw new Error(error.message);
  }
  
  // Revalidate relevant paths
  revalidatePath("/admin/categories");
  return data?.[0];
}

export async function uploadCategoryImageAction(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('file') as File;
  const bucketName = formData.get('bucketName') as string || "category-images";
  
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
    
  return { url: publicUrlData.publicUrl, public_id: filePath };
}

export async function deleteCategoryAction(categoryId: string) {
  
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);
    
  
  if (error) {
    console.error('[ERROR] Supabase delete error:', error);
    throw new Error(error.message);
  }
  
  // Revalidate relevant paths
  revalidatePath("/admin/categories");
  return true;
}
