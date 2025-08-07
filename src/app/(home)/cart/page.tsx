export const dynamic = "force-dynamic";
import { getUser } from "src/lib/actions/auth.actions";
import { getCart } from "src/lib/actions/cart.actions";
import { createClient } from "@utils/supabase/server";
import CartClient from "./CartClient";
import {
  getAllProducts,
  getUsersPurchasedProductIds,
} from "src/queries/products";
import { getAllCategoriesQuery } from "src/queries/categories";
import { mapSupabaseProductToIProductInput } from "src/lib/utils";
import { redirect } from "next/navigation";

export default async function CartPage() {
  // 1. Get authenticated user (optional for anonymous cart)
  const user = await getUser();

  // 2. Create server-side supabase client
  const supabase = await createClient();

  // 3. Fetch cart items (only for authenticated users)
  let cartItems: any[] = [];
  let purchasedProductIds: string[] = [];
  
  if (user) {
    const cartResult = await getCart();
    cartItems = cartResult.success ? cartResult.data : [];

    // 4. Fetch purchased product IDs
    try {
      purchasedProductIds = await getUsersPurchasedProductIds(
        supabase,
        user.user_id
      );
    } catch {}
  }

  // 5. Fetch all categories
  let allCategories: any[] = [];
  try {
    const { data, error } = await getAllCategoriesQuery(supabase).select(
      "id, title, thumbnail"
    );
    if (!error && data) {
      allCategories = data;
    }
  } catch {}

  // 6. Fetch all products
  let allProducts: any[] = [];
  try {
    const allProductsResult = await getAllProducts(supabase, {});
    if (allProductsResult && allProductsResult.products) {
      allProducts = allProductsResult.products;
    }
  } catch {}

  // 7. Map recommended products (not purchased)
  const recommendedProducts = allProducts
    .filter((product: any) => !purchasedProductIds.includes(product.id))
    .map((product: any) =>
      mapSupabaseProductToIProductInput(product, allCategories)
    )
    .filter((p: any) => p.stockStatus === "in_stock")
    .slice(0, 10);

  // 8. Get recently viewed product slugs from cookies (SSR fallback: empty)
  // (Client will handle recently viewed logic)

  return (
    <CartClient
      user={user}
      cartItems={cartItems}
      purchasedProductIds={purchasedProductIds}
      allCategories={allCategories}
      recommendedProducts={recommendedProducts}
    />
  );
}
