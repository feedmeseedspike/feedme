import { NextResponse } from "next/server";
import { 
  getBlogPostBySlug, 
  incrementBlogPostViews 
} from "@/lib/actions/blog.actions";

export async function POST(
  req: Request, 
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    // Get the post first to find its ID
    const post = await getBlogPostBySlug(slug);
    
    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found", success: false }, 
        { status: 404 }
      );
    }
    
    await incrementBlogPostViews(post.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error incrementing views:", error);
    return NextResponse.json(
      { error: "Failed to increment views", success: false }, 
      { status: 500 }
    );
  }
}