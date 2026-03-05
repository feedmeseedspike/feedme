export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { sendUnifiedNotification } from "src/lib/actions/notifications.actions";
import { createClient } from "src/utils/supabase/server";
import { getAllBlogPosts } from "src/lib/actions/blog.actions";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "You must be logged in to test this." }, { status: 401 });
    }

    // Get the latest blog post
    const postsData = await getAllBlogPosts({ limit: 1, status: 'published' });
    const latestPost = postsData.posts[0];

    if (!latestPost) {
       return NextResponse.json({ success: false, error: "No published blog posts found." }, { status: 404 });
    }

    const result = await sendUnifiedNotification({
      userId: user.id,
      type: "info",
      title: "🚀 Test Blog Notification",
      body: `New post check: ${latestPost.title}`,
      link: `/blog/${latestPost.slug}`
    });

    // Check for tokens
    const { data: tokens } = await supabase
      .from("fcm_tokens")
      .select("fcm_token")
      .eq("user_id", user.id);

    return NextResponse.json({ 
      success: true, 
      message: `Notification triggered for you!`,
      details: {
        userId: user.id,
        email: user.email,
        postTitle: latestPost.title,
        postSlug: latestPost.slug,
        tokensFound: tokens?.length || 0
      }
    });
  } catch (error) {
    console.error("Test notification failed:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
