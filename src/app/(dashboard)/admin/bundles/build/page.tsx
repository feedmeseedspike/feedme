export const dynamic = "force-dynamic";
import BuildBundleClient from "./BuildBundleClient";
import { getAllProducts } from "../../../../../queries/products";
import { createClient } from "@/utils/supabase/client";

export default async function BuildBundlePage() {
  const supabase = createClient();
  // Fetch all products (no pagination for selection)
  const { products: allProducts } = await getAllProducts(supabase, {
    limit: 1000,
    page: 1,
  });

  return <BuildBundleClient allProducts={allProducts || []} />;
}
