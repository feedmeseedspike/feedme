import { createClient } from "@utils/supabase/client";
import { Tables } from "@utils/database.types";
import { v4 as uuidv4 } from 'uuid';

interface FetchBundlesParams {
  page?: number;
  itemsPerPage?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  stockStatus?: Tables<'bundles'>['stock_status'][];
  publishedStatus?: Tables<'bundles'>['published_status'][];
}

export async function fetchBundles({
  page = 1,
  itemsPerPage = 10,
  search = '',
  sortBy = 'name',
  sortOrder = 'asc',
  stockStatus = [],
  publishedStatus = [],
}: FetchBundlesParams): Promise<{ data: Tables<'bundles'>[] | null; count: number | null }> {
  const supabase = createClient();

  let query = supabase.from('bundles').select('*', { count: 'exact' });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  // Apply filters only if the arrays are not empty
  if (stockStatus && stockStatus.length > 0) {
    query = query.in('stock_status', stockStatus);
  }

  if (publishedStatus && publishedStatus.length > 0) {
    query = query.in('published_status', publishedStatus);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;
  query = query.range(start, end);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { data, count };
}

interface CreateBundleData {
  name: string;
  price: number;
  description?: string;
  imageFile?: File; // Optional image file
  productIds: string[]; // Array of product IDs
}

export const createBundleWithProducts = async (data: CreateBundleData) => {
  const supabase = createClient();
  let thumbnailUrl: string | null = null;

  // 1. Upload image if provided
  if (data.imageFile) {
    const file = data.imageFile;
    const fileExt = file.name.split('.').pop();
    const filePath = `${uuidv4()}.${fileExt}`; // Generate unique file name

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bundle-thumbnails') // Use the correct bucket name
      .upload(filePath, file);

    if (uploadError) {
      throw new Error("Failed to upload bundle image");
    }

    // Get the public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from('bundle-thumbnails')
      .getPublicUrl(filePath);

    thumbnailUrl = publicUrlData.publicUrl;
  }

  // 2. Insert the new bundle into the bundles table
  const { data: bundleData, error: bundleError } = await supabase
    .from('bundles')
    .insert({
      name: data.name,
      price: data.price,
      description: data.description, // Add description field
      thumbnail_url: thumbnailUrl, // Store the uploaded image URL
      stock_status: 'in_stock', // Default status
      published_status: 'archived', // Default status
    })
    .select()
    .single();

  if (bundleError) {
    throw new Error("Failed to create bundle");
  }

  // 3. Insert entries into the bundle_products linking table
  if (data.productIds.length > 0 && bundleData) {
    const bundleProductsData = data.productIds.map(productId => ({
      bundle_id: bundleData.id,
      product_id: productId,
    }));

    const { error: bundleProductsError } = await supabase
      .from('bundle_products')
      .insert(bundleProductsData);

    if (bundleProductsError) {
      throw new Error("Failed to link products to bundle");
    }
  }

  return bundleData; // Return the created bundle data
};

interface CreateBundleParams {
  name: string;
  price?: number;
  stock_status?: Tables<'bundles'>['stock_status'];
  published_status?: Tables<'bundles'>['published_status'];
  thumbnail_file?: File; // File object for upload
}

export async function createBundle({ name, price, stock_status, published_status, thumbnail_file }: CreateBundleParams): Promise<Tables<'bundles'> | null> {
  const supabase = createClient();
  let thumbnail_url: string | null = null;

  if (thumbnail_file) {
    const filePath = `bundle_thumbnails/${Date.now()}_${thumbnail_file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bundle-thumbnails') // Assuming you have a bucket named 'bundle-thumbnails'
      .upload(filePath, thumbnail_file);

    if (uploadError) {
      throw uploadError; // Propagate the error
    }

    // Get the public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('bundle-thumbnails')
      .getPublicUrl(filePath);

    thumbnail_url = publicUrlData.publicUrl;
  }

  const { data, error } = await supabase
    .from('bundles')
    .insert([
      {
        name,
        price,
        stock_status,
        published_status,
        thumbnail_url,
      },
    ])
    .select()
    .single(); // Assuming you want the inserted row back

  if (error) {
    throw error; // Propagate the error
  }

  return data;
}

// Function to fetch a single bundle by ID, including its products
export const fetchBundleByIdWithProducts = async (bundleId: string, supabase?: any) => {
  if (!supabase) {
    supabase = createClient();
  }

  // Fetch the bundle details and join with bundle_products and products
  const { data, error } = await supabase
    .from('bundles')
    .select(
      `
      *,
      bundle_products (
        product:products (*)
      )
      `
      // Select all bundle columns (*)
      // Then select product_id from the linking table bundle_products
      // And select all columns (*) from the products table aliased through the bundle_products relationship
    )
    .eq('id', bundleId)
    .single(); // Expecting a single bundle

  if (error) {
    throw error; // Propagate the error
  }

  // Supabase returns the joined data in a nested structure.
  // We need to transform it into a more usable format:
  // { ...bundleDetails, products: [...productObjects] }
  const bundleDetails = data;
  const linkedProducts = data?.bundle_products?.map((bp: { product: Tables<'products'> | null }) => bp.product).filter(Boolean) || [];

  const transformedBundle = {
    ...bundleDetails,
    products: linkedProducts as Tables<'products'>[] // Extract product objects and cast
  };

  return transformedBundle;
};

// Function to fetch a single bundle by slug, including its products
export const fetchBundleBySlugWithProducts = async (bundleSlug: string) => {
  const supabase = createClient();
  
  // First, try to get all bundles and find the one that matches the slug
  const { data: allBundles, error: fetchError } = await supabase
    .from('bundles')
    .select('*');

  if (fetchError) {
    throw fetchError;
  }

  // Find the bundle whose name, when converted to slug, matches the provided slug
  const matchingBundle = allBundles?.find(bundle => {
    if (!bundle.name) return false;
    const bundleSlug_generated = bundle.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return bundleSlug_generated === bundleSlug;
  });

  if (!matchingBundle) {
    throw new Error('Bundle not found');
  }

  // Now fetch the bundle with its products using the ID
  const { data, error } = await supabase
    .from('bundles')
    .select(
      `
      *,
      bundle_products (
        product:products (*)
      )
      `
    )
    .eq('id', matchingBundle.id)
    .single(); // Expecting a single bundle

  if (error) {
    throw error; // Propagate the error
  }

  // Supabase returns the joined data in a nested structure.
  // We need to transform it into a more usable format:
  // { ...bundleDetails, products: [...productObjects] }
  const bundleDetails = data;
  const linkedProducts = data?.bundle_products?.map((bp: { product: Tables<'products'> | null }) => bp.product).filter(Boolean) || [];

  const transformedBundle = {
    ...bundleDetails,
    products: linkedProducts as Tables<'products'>[] // Extract product objects and cast
  };

  return transformedBundle;
};

interface UpdateBundleData {
  id: string; // Bundle ID
  name: string;
  price: number;
  description?: string; // Optional description
  imageFile?: File; // Optional new image file
  productIds: string[]; // Array of product IDs
}

export const updateBundleWithProducts = async (data: UpdateBundleData) => {
  const supabase = createClient();
  let thumbnailUrl: string | null | undefined = undefined;

  // 1. Upload new image if provided
  if (data.imageFile) {
    const file = data.imageFile;
    const fileExt = file.name.split('.').pop();
    const filePath = `${uuidv4()}.${fileExt}`; // Generate unique file name

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bundle-thumbnails')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error("Failed to upload new bundle image");
    }

    const { data: publicUrlData } = supabase.storage
      .from('bundle-thumbnails')
      .getPublicUrl(filePath);

    thumbnailUrl = publicUrlData.publicUrl;
  } else {
    // No file provided, don't update the thumbnail_url unless explicitly clearing (not implemented here)
    thumbnailUrl = undefined; // Indicates no change to thumbnail_url column
  }

  // Prepare update data for the bundles table
  const updateBundlePayload: {
    name: string;
    price: number;
    description?: string;
    thumbnail_url?: string | null;
    updated_at: string;
  } = {
    name: data.name,
    price: data.price,
    updated_at: new Date().toISOString(),
  };

  // Only include description if it's provided
   if (data.description !== undefined) {
       updateBundlePayload.description = data.description;
   }

  // Only include thumbnail_url if a new image was uploaded or it's explicitly set to null
  if (thumbnailUrl !== undefined) {
      updateBundlePayload.thumbnail_url = thumbnailUrl;
  }

  // 2. Update the bundle in the bundles table
  const { data: bundleData, error: bundleError } = await supabase
    .from('bundles')
    .update(updateBundlePayload)
    .eq('id', data.id)
    .select()
    .single();

  if (bundleError) {
    throw new Error("Failed to update bundle");
  }

  // 3. Update the bundle_products linking table
  // Delete existing links
  const { error: deleteError } = await supabase
    .from('bundle_products')
    .delete()
    .eq('bundle_id', data.id);

  if (deleteError) {
    throw new Error("Failed to update bundle products");
  }

  // Insert new links
  if (data.productIds.length > 0) {
    const bundleProductsData = data.productIds.map(productId => ({
      bundle_id: data.id,
      product_id: productId,
    }));

    const { error: insertError } = await supabase
      .from('bundle_products')
      .insert(bundleProductsData);

    if (insertError) {
      throw new Error("Failed to insert new bundle products");
    }
  }

  return bundleData; // Return the updated bundle data
};

// Function to delete a bundle by ID
export async function deleteBundle(bundleId: string) {
  const response = await fetch(`/api/bundles/${bundleId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete bundle');
  }

  return await response.json();
} 