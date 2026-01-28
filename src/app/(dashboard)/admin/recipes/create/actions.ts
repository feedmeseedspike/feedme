"use server";

import { createClient } from "src/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createRecipeBundleAction(bundleData: {
  name: string;
  price: number;
  description?: string;
  thumbnail: { url: string; public_id?: string } | null;
  productIds: string[];
  // Recipe specific fields
  videoUrl?: string;
  chefName?: string;
}) {
  const supabase = await createClient();
  
  // Insert the new bundle into the bundles table
  const { data: bundleRecord, error: bundleError } = await supabase
    .from('bundles')
    .insert({
      name: bundleData.name,
      price: bundleData.price,
      description: bundleData.description,
      thumbnail_url: bundleData.thumbnail?.url || null,
      stock_status: 'in_stock',
      published_status: 'published',
      // Recipe fields
      type: 'recipe',
      video_url: bundleData.videoUrl || null,
      chef_name: bundleData.chefName || null,
    })
    .select()
    .single();

  if (bundleError) {
    console.error('[ERROR] Recipe Bundle insert error:', bundleError);
    throw new Error(bundleError.message);
  }

  // Insert entries into the bundle_products linking table
  if (bundleData.productIds.length > 0 && bundleRecord) {
    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = bundleData.productIds.filter(id => !uuidRegex.test(id));
    
    if (invalidIds.length > 0) {
      throw new Error(`Invalid product IDs detected: ${invalidIds.join(', ')}`);
    }
    
    const bundleProductsData = bundleData.productIds.map(productId => ({
      bundle_id: bundleRecord.id,
      product_id: productId,
    }));

    const { error: bundleProductsError } = await supabase
      .from('bundle_products')
      .insert(bundleProductsData);

    if (bundleProductsError) {
      throw new Error(`Failed to link products to bundle: ${bundleProductsError.message}`);
    }
  }

  // Revalidate relevant paths
  revalidatePath("/admin/recipes");
  revalidatePath("/admin/bundles");
  revalidatePath("/recipes");
  
  return bundleRecord;
}

export async function uploadBundleImageAction(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('file') as File;
  const bucketName = formData.get('bucketName') as string || "bundle-thumbnails";
  
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

export async function updateBundleAction(bundleData: {
  id: string;
  name: string;
  price: number;
  description?: string;
  thumbnail: { url: string; public_id?: string } | null;
  productIds: string[];
  videoUrl?: string;
  chefName?: string;
}) {
  const supabase = await createClient();
  
  // Update the bundle in the bundles table
  const { data: bundleRecord, error: bundleError } = await supabase
    .from('bundles')
    .update({
      name: bundleData.name,
      price: bundleData.price,
      description: bundleData.description,
      thumbnail_url: bundleData.thumbnail?.url || null,
      video_url: bundleData.videoUrl || null,
      chef_name: bundleData.chefName || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bundleData.id)
    .select()
    .single();

  if (bundleError) {
    console.error('[ERROR] Bundle update error:', bundleError);
    throw new Error(bundleError.message);
  }

  // Delete existing bundle-product relationships
  const { error: deleteError } = await supabase
    .from('bundle_products')
    .delete()
    .eq('bundle_id', bundleData.id);

  if (deleteError) {
    console.error('[ERROR] Bundle products delete error:', deleteError);
    throw new Error("Failed to update bundle products");
  }

  // Insert new bundle-product relationships
  if (bundleData.productIds.length > 0) {
    // Validate UUIDs before attempting insert
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; // Note: adjusted regex if needed, or keep standard
    const uuidRegexStandard = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    const invalidIds = bundleData.productIds.filter(id => !uuidRegexStandard.test(id));
    
    if (invalidIds.length > 0) {
      console.error('[ERROR] Invalid UUID format detected:', invalidIds);
      throw new Error(`Invalid product IDs detected: ${invalidIds.join(', ')}`);
    }
    
    const bundleProductsData = bundleData.productIds.map(productId => ({
      bundle_id: bundleData.id,
      product_id: productId,
    }));

    const { error: bundleProductsError } = await supabase
      .from('bundle_products')
      .insert(bundleProductsData);

    if (bundleProductsError) {
      console.error('[ERROR] Bundle products insert error:', bundleProductsError);
      throw new Error(`Failed to link products to bundle: ${bundleProductsError.message}`);
    }
  }

  // Revalidate relevant paths
  revalidatePath("/admin/recipes");
  revalidatePath("/admin/bundles");
  revalidatePath("/recipes");
  
  return bundleRecord;
}
