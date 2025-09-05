import { NextResponse } from "next/server";
import { 
  getBlogPostBySlug, 
  updateBlogPost, 
  deleteBlogPost,
  incrementBlogPostViews 
} from "@/lib/actions/blog.actions";

export async function GET(
  req: Request, 
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { searchParams } = new URL(req.url);
  const incrementViews = searchParams.get("incrementViews") === "true";

  try {
    const post = await getBlogPostBySlug(slug);
    
    // Increment views if requested (typically from post page visits)
    if (incrementViews && post) {
      await incrementBlogPostViews(post.id);
      post.views_count += 1;
    }
    
    return NextResponse.json({ post, success: true });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Blog post not found", success: false }, 
      { status: 404 }
    );
  }
}

export async function PUT(
  req: Request, 
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const body = await req.json();
    
    // Get the post ID from slug first
    const existingPost = await getBlogPostBySlug(slug);
    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found", success: false }, 
        { status: 404 }
      );
    }
    
    const updatedPost = await updateBlogPost(existingPost.id, body);
    
    return NextResponse.json({ post: updatedPost, success: true });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post", success: false }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request, 
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    // Get the post ID from slug first
    const existingPost = await getBlogPostBySlug(slug);
    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found", success: false }, 
        { status: 404 }
      );
    }
    
    await deleteBlogPost(existingPost.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post", success: false }, 
      { status: 500 }
    );
  }
}