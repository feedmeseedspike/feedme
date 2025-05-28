import { TypedSupabaseClient } from '../utils/types'; 

export function getAllCategoriesQuery(client: TypedSupabaseClient) {
  return client
    .from('categories')
    .select('id, name, slug'); 
} 