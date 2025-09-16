import { NextResponse } from "next/server";
import { 
  getBlogPostBySlug, 
  getBlogPostBySlugAdmin,
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

    if (incrementViews && post) {
      await incrementBlogPostViews(post.id);
      post.views_count += 1;
    }

    const response = NextResponse.json({ post, success: true });

    const cacheTime = incrementViews ? 60 : 600;
    response.headers.set('Cache-Control', `public, s-maxage=${cacheTime}, stale-while-revalidate=120`);

    return response;
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
    
    const existingPost = await getBlogPostBySlugAdmin(slug);
    
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
      { 
        error: error instanceof Error ? error.message : "Failed to update blog post", 
        success: false,
        details: error
      }, 
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
    const existingPost = await getBlogPostBySlugAdmin(slug);
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