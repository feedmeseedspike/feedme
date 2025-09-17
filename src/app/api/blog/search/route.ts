import { NextResponse } from "next/server";
import { searchBlogPosts } from "@/lib/actions/blog.actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const limit = Number(searchParams.get("limit")) || 10;

  if (!query) {
    return NextResponse.json({ posts: [], success: true });
  }

  try {
    const posts = await searchBlogPosts(query, limit);
    
    return NextResponse.json({ posts, success: true });
  } catch (error) {
    console.error("Error searching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to search blog posts", success: false }, 
      { status: 500 }
    );
  }
}