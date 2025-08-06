import { NextResponse } from "next/server";
import { getBanner, getProductByTag } from "@/lib/actions/product.actions";

export async function GET() {
  try {
    const products = await getBanner();
    // Only return id, slug, name, image
    return NextResponse.json({ banners: products });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
