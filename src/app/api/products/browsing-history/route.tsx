import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@utils/supabase/server";
import { Products } from "src/lib/validator";

export const GET = async (request: NextRequest) => {
  const listType = request.nextUrl.searchParams.get("type") || "history";
  const productIdsParam = request.nextUrl.searchParams.get("ids");
  const categoriesParam = request.nextUrl.searchParams.get("categories");

  if (!productIdsParam) {
    return NextResponse.json([]);
  }

  const productIds = productIdsParam.split(",");
  const categories = categoriesParam ? categoriesParam.split(",") : [];

  // // console.log('Product IDs:', productIds)
  // // console.log('Categories:', categories)

  let filteredProducts = [];

  const supabase = await createClient();

  if (listType === "history") {
    // Fetch products from Supabase matching productIds
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (error) {
      console.error("Error fetching browsing history products:", error);
      return NextResponse.json([], { status: 500 });
    }

    filteredProducts = data || [];

    // Preserve the original order if data was fetched
    if (filteredProducts.length > 0) {
      filteredProducts.sort(
        (a: any, b: any) => productIds.indexOf(a.id) - productIds.indexOf(b.id)
      );
    }
  } else {
    // Fetch related products from the same categories from Supabase
    // Excluding products already in history
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .overlaps("category_ids", categories)
      .not("id", "in", `(${productIds.join(",")})`);

    if (error) {
      console.error("Error fetching related products:", error);
      return NextResponse.json([], { status: 500 });
    }

    filteredProducts = data || [];
  }

  return NextResponse.json(filteredProducts);
};
