import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(req.url);
  const searchSlug = searchParams.get("slug") || "over-100-families-have-been-nourished-one-carefully-prepared-order-at-a-time";

  try {
    // 1. Exact match check with relations
    const { data: exactPost, error: exactError } = await supabase
      .from("blog_posts")
      .select(`
        *,
        blog_categories(*),
        blog_post_tags(blog_tags(*)),
        blog_recipe_products(*)
      `)
      .eq("slug", searchSlug)
      .eq("status", "published")
      .single();

    // 2. Partial match check (to see if it's truncated)
    const partialSlug = searchSlug.substring(0, 20);
    const { data: partialPosts, error: partialError } = await supabase
      .from("blog_posts")
      .select("id, title, slug, status")
      .ilike("slug", `${partialSlug}%`)
      .limit(5);

    return NextResponse.json({
      timestamp: Date.now(),
      searchSlug,
      exactMatch: { data: exactPost, error: exactError },
      partialMatches: { data: partialPosts, error: partialError }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
