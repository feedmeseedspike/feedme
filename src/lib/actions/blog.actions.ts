"use server";

import { createServiceRoleClient } from "@/utils/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  featured?: boolean;
  post_count?: number;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image?: string | null;
  featured_image_alt?: string | null;
  status: "draft" | "published" | "archived";
  featured?: boolean;
  author_id?: string | null;
  category_id?: string | null;
  tags?: string[] | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  reading_time?: number | null;
  views_count: number;
  likes_count: number;
  prep_time?: number | null;
  cook_time?: number | null;
  servings?: number | null;
  difficulty?: "easy" | "medium" | "hard" | null;
  ingredients?: any[] | null;
  instructions?: any[] | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  linked_products?: string[] | null;
  // Joined relation fields (optional, from Supabase selects with joins)
  blog_categories?: { id: string; name: string; slug: string } | null;
  blog_post_tags?: Array<{ blog_tags: { id: string; name: string } }> | null;
  blog_recipe_products?: Array<{ id: string; product?: any }> | null;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getAllBlogCategories(): Promise<BlogCategory[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function getFeaturedBlogCategories(): Promise<BlogCategory[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("featured", true)
    .order("name");

  if (error) throw error;
  return data || [];
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function getAllBlogPosts(options?: {
  limit?: number;
  offset?: number;
  category?: string;
  featured?: boolean;
  status?: string;
}): Promise<{ posts: BlogPost[]; totalCount: number }> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .order("published_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.category) {
    query = query.eq("category_id", options.category);
  }
  if (options?.featured !== undefined) {
    query = query.eq("featured", options.featured);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    const from = options.offset;
    const to = from + (options.limit ?? 10) - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { posts: data || [], totalCount: count || 0 };
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return data;
}

export async function getBlogPostBySlugAdmin(slug: string): Promise<BlogPost | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function getFeaturedBlogPosts(limit = 3): Promise<BlogPost[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getRelatedBlogPosts(
  postId: string,
  categoryId?: string | null,
  limit = 3
): Promise<BlogPost[]> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .neq("id", postId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;

  // If not enough from same category, fill with other posts
  if ((data?.length ?? 0) < limit && categoryId) {
    const { data: morePosts } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .neq("id", postId)
      .neq("category_id", categoryId)
      .order("published_at", { ascending: false })
      .limit(limit - (data?.length ?? 0));

    return [...(data || []), ...(morePosts || [])];
  }

  return data || [];
}

export async function searchBlogPosts(
  query: string,
  limit = 10
): Promise<BlogPost[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function createBlogPost(
  postData: Partial<BlogPost>
): Promise<BlogPost> {
  const supabase = createServiceRoleClient();

  const now = new Date().toISOString();
  const payload = {
    ...postData,
    views_count: postData.views_count ?? 0,
    likes_count: postData.likes_count ?? 0,
    created_at: now,
    updated_at: now,
    published_at:
      postData.status === "published"
        ? postData.published_at ?? now
        : postData.published_at ?? null,
  };

  if (payload.category_id === "") payload.category_id = null;
  if (payload.author_id === "") payload.author_id = null;
  if ((payload.difficulty as any) === "") payload.difficulty = null;
  if ((payload.prep_time as any) === "") payload.prep_time = null;
  if ((payload.cook_time as any) === "") payload.cook_time = null;
  if ((payload.servings as any) === "") payload.servings = null;
  if ((payload.reading_time as any) === "") payload.reading_time = null;

  const { data, error } = await supabase
    .from("blog_posts")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBlogPost(
  id: string,
  postData: Partial<BlogPost>
): Promise<BlogPost> {
  const supabase = createServiceRoleClient();

  const payload: any = {
    ...postData,
    updated_at: new Date().toISOString(),
  };

  if (payload.category_id === "") payload.category_id = null;
  if (payload.author_id === "") payload.author_id = null;
  if ((payload.difficulty as any) === "") payload.difficulty = null;
  if ((payload.prep_time as any) === "") payload.prep_time = null;
  if ((payload.cook_time as any) === "") payload.cook_time = null;
  if ((payload.servings as any) === "") payload.servings = null;
  if ((payload.reading_time as any) === "") payload.reading_time = null;

  // Set published_at when first publishing
  if (postData.status === "published" && !postData.published_at) {
    // Fetch existing to check if already has one
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("published_at")
      .eq("id", id)
      .single();
    if (!existing?.published_at) {
      payload.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBlogPost(id: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function incrementBlogPostViews(id: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.rpc("increment_blog_views", { post_id: id });
  if (error) {
    // Fallback: manual increment
    await supabase
      .from("blog_posts")
      .update({ views_count: supabase.rpc("increment_blog_views", { post_id: id }) as any })
      .eq("id", id);
  }
}

// ─── Likes ───────────────────────────────────────────────────────────────────

export async function toggleBlogPostLike(
  postId: string,
  userId?: string,
  guestId?: string
): Promise<{ liked: boolean; likes_count: number }> {
  const supabase = createServiceRoleClient();

  // Check if already liked
  let query = supabase
    .from("blog_post_likes")
    .select("id")
    .eq("post_id", postId);

  if (userId) query = query.eq("user_id", userId);
  else if (guestId) query = query.eq("guest_id", guestId);

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    // Unlike
    await supabase.from("blog_post_likes").delete().eq("id", existing.id);
    await supabase.rpc("decrement_blog_likes", { post_id: postId });
  } else {
    // Like
    await supabase.from("blog_post_likes").insert({
      post_id: postId,
      user_id: userId || null,
      guest_id: guestId || null,
    });
    await supabase.rpc("increment_blog_likes", { post_id: postId });
  }

  // Get updated count
  const { data: post } = await supabase
    .from("blog_posts")
    .select("likes_count")
    .eq("id", postId)
    .single();

  return { liked: !existing, likes_count: post?.likes_count ?? 0 };
}

export async function checkBlogPostLike(
  postId: string,
  userId?: string,
  guestId?: string
): Promise<{ liked: boolean }> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("blog_post_likes")
    .select("id")
    .eq("post_id", postId);

  if (userId) query = query.eq("user_id", userId);
  else if (guestId) query = query.eq("guest_id", guestId);

  const { data } = await query.maybeSingle();
  return { liked: !!data };
}

// ─── Tags ────────────────────────────────────────────────────────────────────

export async function getAllBlogTags(): Promise<string[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("tags")
    .eq("status", "published");

  if (error) throw error;

  const allTags = new Set<string>();
  (data || []).forEach((post: any) => {
    if (Array.isArray(post.tags)) {
      post.tags.forEach((tag: string) => allTags.add(tag));
    }
  });

  return Array.from(allTags).sort();
}
