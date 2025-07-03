export const dynamic = "force-dynamic";
import EditBundleClient from "./EditBundleClient";
import { fetchBundleByIdWithProducts } from "../../../../../../queries/bundles";
import { getAllProducts } from "../../../../../../queries/products";
import { createClient } from "@/utils/supabase/client";
import { notFound } from "next/navigation";

export default async function EditBundlePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = createClient();
  let initialBundle = null;
  try {
    initialBundle = await fetchBundleByIdWithProducts(id);
  } catch (err) {
    return notFound();
  }
  if (!initialBundle) {
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
