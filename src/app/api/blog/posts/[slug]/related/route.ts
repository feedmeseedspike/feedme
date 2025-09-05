import { NextResponse } from "next/server";
import { 
  getBlogPostBySlug, 
  getRelatedBlogPosts 
} from "@/lib/actions/blog.actions";

export async function GET(
  req: Request, 
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit")) || 3;

  try {
    // Get the post first to find its ID and category
    const post = await getBlogPostBySlug(slug);
    
    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found", success: false }, 
        { status: 404 }
      );
    }
    
    const relatedPosts = await getRelatedBlogPosts(post.id, post.category_id, limit);
    
    return NextResponse.json({ posts: relatedPosts, success: true });
  } catch (error) {
    console.error("Error fetching related posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch related posts", success: false }, 
      { status: 500 }
    );
  }
}