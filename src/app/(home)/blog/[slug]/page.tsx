import { notFound } from "next/navigation";
import { Suspense } from "react";
import Container from "@components/shared/Container";
import BlogPostContent from "@components/shared/blog/BlogPostContent";
import BlogPostSkeleton from "@components/shared/blog/BlogPostSkeleton";
import RelatedPosts from "@components/shared/blog/RelatedPosts";
import { Metadata } from "next";
import { getBlogPostBySlug, incrementBlogPostViews } from "@/lib/actions/blog.actions";

export const revalidate = 0;

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  try {
    const post = await getBlogPostBySlug(params.slug);

    if (!post) {
      return {
        title: "Post Not Found | FeedMe Blog",
        description: "The blog post you're looking for could not be found.",
      };
    }

    return {
      title: post.meta_title || `${post.title} | FeedMe Blog`,
      description: post.meta_description || post.excerpt || post.title,
      keywords: post.meta_keywords,
      openGraph: {
        title: post.title,
        description: post.excerpt || post.title,
        type: "article",
        publishedTime: post.published_at || undefined,
        authors: post.author_id ? [post.author_id] : undefined,
        images: post.featured_image
          ? [
              {
                url: post.featured_image,
                alt: post.featured_image_alt || post.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt || post.title,
        images: post.featured_image ? [post.featured_image] : undefined,
      },
    };
  } catch (error) {
    return {
      title: "Error | FeedMe Blog",
      description: "An error occurred while loading this blog post.",
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const post = await getBlogPostBySlug(params.slug);

    if (!post) {
      notFound();
    }

    // Increment view count asynchronously (fire and forget)
    incrementBlogPostViews(post.id).catch(console.error);

    return (
      <div className="min-h-screen bg-[#FAFAF9]">
        <Container className="py-12 md:py-20">
          <div className="max-w-5xl mx-auto">
            <Suspense fallback={<BlogPostSkeleton />}>
              <BlogPostContent post={post} />
            </Suspense>

            <div className="mt-24">
              <Suspense fallback={<RelatedPostsSkeleton />}>
                <RelatedPosts slug={post.slug} />
              </Suspense>
            </div>
          </div>
        </Container>
      </div>
    );
  } catch (error) {
    if ((error as any)?.message?.includes('JSON object requested, multiple (or no) rows returned')) {
       notFound();
    }
    console.error("Error fetching blog post:", error);
    notFound(); 
  }
}

function RelatedPostsSkeleton() {
  return (
    <div className="border-t border-gray-100 pt-16">
      <h2 className="text-3xl font-proxima font-bold text-[#1D2939] mb-10">More to Explore</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-[280px] bg-gray-200 rounded-[20px] animate-pulse" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
