import { getBundle } from "@/lib/actions/product.actions";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const products = await getBundle();
    // Only return id, slug, name, image
    console.log(products);
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
