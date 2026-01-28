export const dynamic = "force-dynamic";
import EditRecipeClient from "./EditRecipeClient";
import { getAllProducts } from "../../../../../../queries/products";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export default async function EditRecipePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = await createClient();
  
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

    if (error) throw error;

    const productIds = data.bundle_products?.map((bp: any) => bp.product_id).filter(Boolean) || [];
    let linkedProducts: any[] = [];
    
    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      if (!productsError) linkedProducts = products || [];
    }

    initialBundle = { ...data, products: linkedProducts };
  } catch (err) {
    return notFound();
  }
  
  if (!initialBundle) return notFound();
  
  const { products: allProducts } = await getAllProducts(supabase, {
    limit: 1000,
    page: 1,
  });

  return (
    <EditRecipeClient
      initialBundle={initialBundle}
      allProducts={allProducts || []}
    />
  );
}
