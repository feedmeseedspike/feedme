import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { posts } = await req.json();

    if (!posts || !Array.isArray(posts)) {
      return NextResponse.json(
        { error: "Posts array is required", success: false },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    // Delete all existing blog posts
    const { error: deleteError } = await supabase
      .from("blog_posts")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all posts

    if (deleteError) {
      console.error("Error deleting existing posts:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete existing posts", success: false },
        { status: 500 }
      );
    }

    // Insert new posts
    const postsToInsert = posts.map(post => {
      const { idx, ...postData } = post; // Remove idx field
      return {
        ...postData,
        created_at: postData.created_at || new Date().toISOString(),
        updated_at: postData.updated_at || new Date().toISOString(),
        views_count: postData.views_count || 0,
        likes_count: postData.likes_count || 0,
        featured: postData.featured || false,
      };
    });

    const { data, error: insertError } = await supabase
      .from("blog_posts")
      .insert(postsToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting new posts:", insertError);
      return NextResponse.json(
        { error: "Failed to insert new posts", success: false, details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully replaced all blog posts. Added ${data.length} new posts.`,
      data
    });

  } catch (error) {
    console.error("Error in bulk replace:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}