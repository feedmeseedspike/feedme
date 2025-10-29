"use server";

import { createClient, createServiceRoleClient } from "../../utils/supabase/server";
import slugify from "slugify";

// Types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  featured_image_alt?: string;
  category_id?: string;
  author_id?: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  published_at?: string;
  reading_time?: number;
  views_count: number;
  likes_count: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  ingredients?: any[];
  instructions?: any[];
  nutritional_info?: any;
  created_at: string;
  updated_at: string;
  // Relations
  blog_categories?: BlogCategory;
  blog_post_tags?: { blog_tags: BlogTag }[];
  blog_recipe_products?: BlogRecipeProduct[];
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogRecipeProduct {
  id: string;
  post_id: string;
  product_id: string;
  ingredient_name: string;
  quantity?: string;
  optional?: boolean;
  created_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Blog Posts Actions
export async function getAllBlogPosts({
  limit = 10,
  offset = 0,
  category,
  featured,
  status
}: {
  limit?: number;
  offset?: number;
  category?: string;
  featured?: boolean;
  status?: string;
} = {}) {
  const supabase = await createClient();

  let categoryId: string | undefined;

  // If category slug is provided, get the category ID first
  if (category) {
    const { data: categoryData, error: categoryError } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", category)
      .single();

    if (categoryError || !categoryData) {
      // If category doesn't exist, return empty array
      return [];
    }

    categoryId = categoryData.id;
  }

  let query = supabase
    .from("blog_posts")
    .select(`
      *,
      blog_categories(*),
      blog_post_tags(blog_tags(*))
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (featured !== undefined) {
    query = query.eq("featured", featured);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as BlogPost[];
}

export async function getBlogPostBySlug(slug: string) {
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      blog_categories(*),
      blog_post_tags(blog_tags(*)),
      blog_recipe_products(*)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  
  if (error) throw error;
  return data as BlogPost;
}

// Admin version that doesn't filter by status
export async function getBlogPostBySlugAdmin(slug: string) {
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      blog_categories(*),
      blog_post_tags(blog_tags(*))
    `)
    .eq("slug", slug)
    .single();
  
  if (error) throw error;
  return data as BlogPost;
}

export async function getFeaturedBlogPosts(limit = 3) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      blog_categories(*),
      blog_post_tags(blog_tags(*))
    `)
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data as BlogPost[];
}

export async function getRelatedBlogPosts(postId: string, categoryId?: string, limit = 3) {
  const supabase = await createClient();
  
  let query = supabase
    .from("blog_posts")
    .select(`
      *,
      blog_categories(*),
      blog_post_tags(blog_tags(*))
    `)
    .eq("status", "published")
    .neq("id", postId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data as BlogPost[];
}

export async function searchBlogPosts(searchTerm: string, limit = 10) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      blog_categories(*),
      blog_post_tags(blog_tags(*))
    `)
    .eq("status", "published")
    .or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .order("published_at", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data as BlogPost[];
}

export async function incrementBlogPostViews(postId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.rpc('increment_blog_post_views', {
    post_id: postId
  });
  
  if (error) {
    console.error('Error incrementing views:', error);
  }
}

// Create Blog Post (Admin)
export async function createBlogPost(postData: Partial<BlogPost>) {
  const supabase = createServiceRoleClient();
  
  // Generate slug from title
  const slug = postData.title ? slugify(postData.title, { lower: true, strict: true }) : '';
  
  // Calculate reading time (rough estimate: 200 words per minute)
  const wordCount = postData.content ? postData.content.replace(/<[^>]*>/g, '').split(' ').length : 0;
  const reading_time = Math.ceil(wordCount / 200);
  
  const { data, error } = await supabase
    .from("blog_posts")
    .insert([{
      ...postData,
      slug,
      reading_time,
      published_at: postData.status === 'published' ? new Date().toISOString() : null,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data as BlogPost;
}

export async function updateBlogPost(postId: string, postData: Partial<BlogPost>) {
  // Use service role for admin operations to bypass RLS
  const supabase = createServiceRoleClient();
  
  
  
  // Don't auto-generate slug for existing posts to avoid conflicts
  // Only update slug if explicitly provided and different from auto-generated
  if (postData.title) {
    const autoSlug = slugify(postData.title, { lower: true, strict: true });
    
    // Don't update slug automatically - keep the original slug
    delete postData.slug;
  }
  
  // Calculate reading time if content changed
  if (postData.content) {
    const wordCount = postData.content.replace(/<[^>]*>/g, '').split(' ').length;
    postData.reading_time = Math.ceil(wordCount / 200);
    
  }
  
  // Set published_at if status changes to published
  if (postData.status === 'published') {
    postData.published_at = new Date().toISOString();
    
  }
  
  // Clean up the data - remove empty strings and null values that might cause issues
  const cleanedData = Object.fromEntries(
    Object.entries(postData).filter(([key, value]) => {
      // Keep non-null, non-undefined values, and non-empty strings
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
  );
  
  
  
  // First verify the post exists with this ID
  const { data: existingCheck, error: checkError } = await supabase
    .from("blog_posts")
    .select("id, title, slug")
    .eq("id", postId)
    .single();
  
  
  
  if (checkError || !existingCheck) {
    throw new Error(`Post with ID ${postId} does not exist in database`);
  }
  
  const { data, error } = await supabase
    .from("blog_posts")
    .update(cleanedData)
    .eq("id", postId)
    .select();
  
  
  
  if (error) {
    console.error("Supabase update error:", error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    console.error("No rows updated for post ID:", postId);
    throw new Error("Blog post not found or could not be updated");
  }
  
  
  return data[0] as BlogPost;
}

export async function deleteBlogPost(postId: string) {
  const supabase = createServiceRoleClient();
  
  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", postId);
  
  if (error) throw error;
}

// Blog Categories Actions
export async function getAllBlogCategories() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  
  if (error) throw error;
  return data as BlogCategory[];
}

export async function getBlogCategoryBySlug(slug: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("slug", slug)
    .single();
  
  if (error) throw error;
  return data as BlogCategory;
}

export async function getFeaturedBlogCategories() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("featured", true)
    .order("sort_order", { ascending: true });
  
  if (error) throw error;
  return data as BlogCategory[];
}

// Blog Tags Actions
export async function getAllBlogTags() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("blog_tags")
    .select("*")
    .order("name", { ascending: true });
  
  if (error) throw error;
  return data as BlogTag[];
}

export async function getBlogPostsByTag(tagSlug: string, limit = 10) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      blog_categories(*),
      blog_post_tags!inner(blog_tags!inner(*))
    `)
    .eq("status", "published")
    .eq("blog_post_tags.blog_tags.slug", tagSlug)
    .order("published_at", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data as BlogPost[];
}

// Blog Likes Actions
export async function toggleBlogPostLike(postId: string, userId: string) {
  const supabase = await createClient();
  
  // Check if user already liked the post
  const { data: existingLike } = await supabase
    .from("blog_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();
  
  if (existingLike) {
    // Unlike - remove the like
    const { error } = await supabase
      .from("blog_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    
    if (error) throw error;
    return { liked: false };
  } else {
    // Like - add the like
    const { error } = await supabase
      .from("blog_post_likes")
      .insert([{ post_id: postId, user_id: userId }]);
    
    if (error) throw error;
    return { liked: true };
  }
}

export async function checkBlogPostLike(postId: string, userId: string) {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("blog_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();
  
  return { liked: !!data };
}

// Blog Comments Actions
export async function getBlogPostComments(postId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("blog_comments")
    .select(`
      *,
      user:auth.users(email, user_metadata)
    `)
    .eq("post_id", postId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createBlogComment(commentData: {
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("blog_comments")
    .insert([commentData])
    .select()
    .single();
  
  if (error) throw error;
  return data as BlogComment;
}