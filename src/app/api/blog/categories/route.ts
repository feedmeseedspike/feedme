import { NextResponse } from "next/server";
import { getAllBlogCategories, getFeaturedBlogCategories } from "@/lib/actions/blog.actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const featured = searchParams.get("featured") === "true";

  try {
    const categories = featured 
      ? await getFeaturedBlogCategories()
      : await getAllBlogCategories();
    
    return NextResponse.json({ categories, success: true });
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog categories", success: false }, 
      { status: 500 }
    );
  }
}