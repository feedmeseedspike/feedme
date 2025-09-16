import { NextResponse } from "next/server";
import { getAllBlogCategories, getFeaturedBlogCategories } from "@/lib/actions/blog.actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const featured = searchParams.get("featured") === "true";

  try {
    const categories = featured
      ? await getFeaturedBlogCategories()
      : await getAllBlogCategories();

    const response = NextResponse.json({ categories, success: true });

    response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=300');

    return response;
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog categories", success: false },
      { status: 500 }
    );
  }
}