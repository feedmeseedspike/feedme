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
          product:products (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('EditBundlePage - error fetching bundle:', error);
      throw error;
    }

    // Transform the data
    const linkedProducts = data?.bundle_products?.map((bp: { product: any }) => bp.product).filter(Boolean) || [];
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
