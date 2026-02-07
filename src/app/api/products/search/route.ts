import { NextResponse } from "next/server";
import { getProductsBySearch } from "@/lib/actions/product.actions";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";

  if (!query) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await getProductsBySearch(query, 10);
    // Only return id, slug, name, image
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
} 