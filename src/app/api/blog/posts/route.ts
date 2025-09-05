import { NextResponse } from "next/server";
import { getAllBlogPosts, createBlogPost } from "@/lib/actions/blog.actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit")) || 10;
  const offset = Number(searchParams.get("offset")) || 0;
  const category = searchParams.get("category") || undefined;
  const featured = searchParams.get("featured") === "true" ? true : undefined;
  const status = searchParams.get("status") || "published";

  try {
    const posts = await getAllBlogPosts({ 
      limit, 
      offset, 
      category, 
      featured, 
      status: status === "all" ? undefined : status  // Don't filter by status if "all"
    });
    
    return NextResponse.json({ posts, success: true });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts", success: false }, 
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const post = await createBlogPost(body);
    
    return NextResponse.json({ post, success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post", success: false }, 
      { status: 500 }
    );
  }
}