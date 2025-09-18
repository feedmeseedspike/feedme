import { notFound } from "next/navigation";
import { Suspense } from "react";
import Container from "@components/shared/Container";
import BlogPostContent from "@components/shared/blog/BlogPostContent";
import BlogPostSkeleton from "@components/shared/blog/BlogPostSkeleton";
import RelatedPosts from "@components/shared/blog/RelatedPosts";
import { Metadata } from "next";

export const revalidate = 600;

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  try {
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // Ensure baseUrl has proper protocol
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `http://${baseUrl}`;
    }
    const response = await fetch(`${baseUrl}/api/blog/posts/${params.slug}`, {
      next: { revalidate: 600 },
      cache: 'force-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const post = data.success ? data.post : null;

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
        images: post.featured_image ? [
          {
            url: post.featured_image,
            alt: post.featured_image_alt || post.title,
          },
        ] : undefined,
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
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // Ensure baseUrl has proper protocol
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `http://${baseUrl}`;
    }
    const response = await fetch(`${baseUrl}/api/blog/posts/${params.slug}`, {
      next: { revalidate: 600 },
      cache: 'force-cache'
    });

    // If the API returns 404, we should trigger notFound()
    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const post = data.success ? data.post : null;

    if (!post) {
      notFound();
    }

    // Increment view count asynchronously
    fetch(`${baseUrl}/api/blog/posts/${post.slug}/views`, {
      method: 'POST'
    }).catch(console.error);

    return (
      <div className="min-h-screen bg-white">
        <Container className="py-8">
          <div className="max-w-4xl mx-auto">
            <Suspense fallback={<BlogPostSkeleton />}>
              <BlogPostContent post={post} />
            </Suspense>

            <div className="mt-16">
              <Suspense fallback={<RelatedPostsSkeleton />}>
                <RelatedPosts slug={post.slug} />
              </Suspense>
            </div>
          </div>
        </Container>
      </div>
    );

  } catch (error) {
    console.error("Error fetching blog post:", error);
    notFound();
  }
}

function RelatedPostsSkeleton() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}