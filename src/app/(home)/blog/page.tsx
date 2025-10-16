export const revalidate = 300;

import Container from "@components/shared/Container";
import { Suspense } from "react";
import BlogHero from "@components/shared/blog/BlogHero";
import FeaturedPosts from "@components/shared/blog/FeaturedPosts";
import BlogGrid from "@components/shared/blog/BlogGrid";
import BlogCategories from "@components/shared/blog/BlogCategories";
import { Skeleton } from "@components/ui/skeleton";

export const metadata = {
  title: "Blog | FeedMe - Recipes, Food Stories & Cooking Tips",
  description: "Discover delicious recipes, food stories, nutrition tips, and cooking guides from FeedMe's blog. Learn about local food culture and cooking techniques.",
  keywords: "recipes, food blog, cooking tips, nutrition, food stories, Nigerian cuisine, cooking guides",
  openGraph: {
    title: "Blog | FeedMe - Recipes, Food Stories & Cooking Tips",
    description: "Discover delicious recipes, food stories, nutrition tips, and cooking guides from FeedMe's blog.",
    url: "https://shopfeedme.com/blog",
    siteName: "FeedMe",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | FeedMe - Recipes, Food Stories & Cooking Tips",
    description: "Discover delicious recipes, food stories, nutrition tips, and cooking guides from FeedMe's blog.",
  },
  alternates: {
    canonical: "https://shopfeedme.com/blog",
  },
};

interface BlogPageProps {
  searchParams: {
    category?: string;
    page?: string;
  };
}

export default function BlogPage({ searchParams }: BlogPageProps) {
  const category = searchParams.category;
  const page = parseInt(searchParams.page || "1", 10);

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHero />

      <Container className="py-8">
        <Suspense fallback={<CategoriesSkeleton />}>
          <BlogCategories selectedCategory={category} />
        </Suspense>

        {!category && (
          <section className="mb-12">
            <Suspense fallback={<FeaturedPostsSkeleton />}>
              <FeaturedPosts />
            </Suspense>
          </section>
        )}

        <section>
          <Suspense fallback={<BlogGridSkeleton />}>
            <BlogGrid category={category} page={page} />
          </Suspense>
        </section>
      </Container>
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-32 flex-shrink-0 rounded-full" />
      ))}
    </div>
  );
}

function FeaturedPostsSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}