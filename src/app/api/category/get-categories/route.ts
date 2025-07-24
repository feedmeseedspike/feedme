import { NextResponse } from "next/server";
import { getCategory, getProductByTag } from "@/lib/actions/product.actions";

export async function GET(req: Request) {
  try {
    const products = await getCategory();
    // Only return id, slug, name, image
    return NextResponse.json({ categories:products });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
