import { NextResponse } from "next/server";
import { 
  getBlogPostBySlug, 
  incrementBlogPostViews 
} from "@/lib/actions/blog.actions";
import { createServiceRoleClient } from "@/utils/supabase/server";

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
    
    // Fetch updated count
    const { data: updatedPost } = await createServiceRoleClient()
      .from("blog_posts")
      .select("views_count")
      .eq("id", post.id)
      .single();
    
    return NextResponse.json({ 
      success: true, 
      views_count: updatedPost?.views_count || post.views_count + 1 
    });
  } catch (error) {
    console.error("Error incrementing views:", error);
    return NextResponse.json(
      { error: "Failed to increment views", success: false }, 
      { status: 500 }
    );
  }
}