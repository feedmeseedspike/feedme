import { NextResponse } from "next/server";
import { getFeaturedBlogPosts } from "@/lib/actions/blog.actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit")) || 3;

  try {
    const posts = await getFeaturedBlogPosts(limit);
    
    return NextResponse.json({ posts, success: true });
  } catch (error) {
    console.error("Error fetching featured blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured blog posts", success: false }, 
      { status: 500 }
    );
  }
}