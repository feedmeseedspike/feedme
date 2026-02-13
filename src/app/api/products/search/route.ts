import { NextResponse } from "next/server";
import { getProductsBySearch, getCategoriesBySearch } from "@/lib/actions/product.actions";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";

  if (!query) {
    return NextResponse.json({ products: [], categories: [] });
  }

  try {
    const [products, categories] = await Promise.all([
      getProductsBySearch(query, 10),
      getCategoriesBySearch(query, 3)
    ]);
    return NextResponse.json({ products, categories });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
} 