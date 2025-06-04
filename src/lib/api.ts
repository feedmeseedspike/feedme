import { createClient } from '../utils/supabase/client';

const supabase = createClient();


export async function getVendors() {
  const { data, error } = await supabase.from('vendors').select('*');
  if (error) throw error;
  return data;
}

export async function getCategories({
  page = 1,
  limit = 10,
  search = '',
  tags = []
}: {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
}) {
  const offset = (page - 1) * limit;

  let query = supabase.from('categories').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (tags && tags.length > 0) {
    query = query.filter('tags', 'ov', `{${tags.join(',')}}`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return { data, count };
}

export async function getProducts({
  page = 1,
  limit = 10,
  search = '',
  category = ''
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}) {
  const offset = (page - 1) * limit;

  let query = supabase.from('products').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return { data, count };
}

export async function getAgents() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'agent');
  if (error) throw error;
  return data;
}

export async function getCustomers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'buyer');
  if (error) throw error;
  return data;
}

export async function getCategoriesByIds(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .in('id', ids);
  if (error) throw error;
  return data;
}

export async function addProduct(product: any) {
  const { data, error } = await supabase.from('products').insert([product]).select();
  if (error) throw error;
  return data?.[0];
}

export async function updateProduct(id: string, product: any) {
  console.log("Attempting to update product with ID:", id, "with data:", product);
  const { data, error } = await supabase.from('products').update(product).eq('id', id).select();
  if (error) {
    console.error("Error updating product:", error);
    throw error;
  }
  console.log("Product updated successfully with ID:", id, "data:", data);
  return data?.[0];
}

export async function deleteProduct(id: string) {
  console.log("Attempting to delete product with ID:", id);
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
  console.log("Product deleted successfully with ID:", id);
  return true;
}

export async function addCategory(category: any) {
  const { data, error } = await supabase.from('categories').insert([category]).select();
  if (error) throw error;
  return data?.[0];
}

export async function updateCategory(id: string, category: any) {
  const { data, error } = await supabase.from('categories').update(category).eq('id', id).select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function countCategories() {
  const { count, error } = await supabase.from('categories').select('*', { count: 'exact' });
  if (error) throw error;
  return count;
}

export async function getCategoryById(id: string) {
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getAllCategories() {
  const { data, error } = await supabase.from('categories').select('*');
  if (error) throw error;
  return data;
}

export async function uploadImage(file: File, bucketName: string = 'category-images') {
  const fileExt = file.name.split('.').pop();
  const filePath = `${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);

  if (error) throw error;

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function countProducts() {
  const { count, error } = await supabase.from('products').select('*', { count: 'exact' });
  if (error) throw error;
  return count;
}

export async function getProductById(id: string) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase.from('products').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data;
}

export async function uploadProductImage(file: File, bucketName: string = 'product-images') {
  const fileExt = file.name.split('.').pop();
  const filePath = `${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);

  if (error) throw error;

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

// Add a placeholder function for fetching a customer by ID
export async function getCustomerById(customerId: number) {
  console.warn(`Fetching customer (user with role 'buyer') with ID: ${customerId}`);
  // Fetch from the 'users' table where id matches and role is 'buyer'
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', customerId)
    .eq('role', 'buyer') // Ensure the user is a buyer
    .single(); // Expect a single result

  if (error) {
    console.error("Error fetching customer by ID:", error);
    throw error;
  }

  // The data structure from Supabase might differ slightly from the dummy data
  // Ensure the returned data matches the Customer interface or map it accordingly
  // For now, returning the raw data. You might need to adjust the interface or map here.
  return data; // This will be null if no user with that ID and role 'buyer' is found
} 