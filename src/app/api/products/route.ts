import { NextResponse } from "next/server";
import { getProductByTag } from "@/lib/actions/product.actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("tag") || "";
  console.log(query);
  if (!query) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await getProductByTag({ tag: query, limit: 10 });
    // Only return id, slug, name, image
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
