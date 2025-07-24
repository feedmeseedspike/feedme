import { NextResponse } from "next/server";
import { getProductsByCategory } from "@/lib/actions/product.actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("productid") || "";
  const catid = searchParams.get("catid") || "";
  console.log(id);
  if (!catid) {
    return NextResponse.json({ products: [] });
  }
  try {
    const products = await getProductsByCategory({
      category: catid,
      productId: id,
    });
    // Only return id, slug, name, image
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
