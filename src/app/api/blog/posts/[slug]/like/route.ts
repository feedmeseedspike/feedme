import { NextResponse } from "next/server";
import { 
  toggleBlogPostLike, 
  checkBlogPostLike,
  getBlogPostBySlug 
} from "@/lib/actions/blog.actions";

export async function POST(
  req: Request, 
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const { userId, guestId } = await req.json();
    
    if (!userId && !guestId) {
      return NextResponse.json(
        { error: "User ID or Guest ID required", success: false }, 
        { status: 400 }
      );
    }

    // Get the post ID from slug
    const post = await getBlogPostBySlug(slug);
    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found", success: false }, 
        { status: 404 }
      );
    }
    
    // Explicitly pass undefined if the value is missing/null to match function signature
    const result = await toggleBlogPostLike(post.id, userId || undefined, guestId || undefined);
    
    return NextResponse.json({ ...result, success: true });
  } catch (error) {
    console.error("Error toggling blog post like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like", success: false }, 
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request, 
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const guestId = searchParams.get("guestId");

  if (!userId && !guestId) {
    return NextResponse.json(
      { error: "User ID or Guest ID required", success: false }, 
      { status: 400 }
    );
  }

  try {
    // Get the post ID from slug
    const post = await getBlogPostBySlug(slug);
    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found", success: false }, 
        { status: 404 }
      );
    }
    
    // Pass undefined for missing values explicitly if needed, but the function signature handles it
    const result = await checkBlogPostLike(post.id, userId || undefined, guestId || undefined);
    
    return NextResponse.json({ ...result, success: true });
  } catch (error) {
    console.error("Error checking blog post like:", error);
    return NextResponse.json(
      { error: "Failed to check like status", success: false }, 
      { status: 500 }
    );
  }
}