export const dynamic = "force-dynamic";
import EditBundleClient from "./EditBundleClient";
import { getAllProducts } from "../../../../../../queries/products";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export default async function EditBundlePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = await createClient();
  
  // Fetch the bundle with products directly in the server component
  let initialBundle = null;
  try {
    const { data, error } = await supabase
      .from('bundles')
      .select(`
        *,
        bundle_products (
          product_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('EditBundlePage - error fetching bundle:', error);
      throw error;
    }

    // Fetch products manually
    const productIds = data.bundle_products?.map((bp: any) => bp.product_id).filter(Boolean) || [];
    let linkedProducts: any[] = [];
    
    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
        
      if (productsError) {
        console.error('EditBundlePage - error fetching linked products:', productsError);
      } else {
        linkedProducts = products || [];
      }
    }

    // Transform the data
    initialBundle = {
      ...data,
      products: linkedProducts
    };
    
    console.log('EditBundlePage - fetched bundle:', JSON.stringify(initialBundle, null, 2));
  } catch (err) {
    console.error('EditBundlePage - error fetching bundle:', err);
    return notFound();
  }
  
  if (!initialBundle) {
    console.log('EditBundlePage - no bundle found');
    return notFound();
  }
  
  // Fetch all products for selection
  const { products: allProducts } = await getAllProducts(supabase, {
    limit: 1000,
    page: 1,
  });

  return (
    <EditBundleClient
      initialBundle={initialBundle}
      allProducts={allProducts || []}
    />
  );
}
