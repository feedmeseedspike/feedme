export const revalidate = 300;

import Container from "@components/shared/Container";
import { Suspense } from "react";
import BlogHero from "@components/shared/blog/BlogHero";
import FeaturedPosts from "@components/shared/blog/FeaturedPosts";
import BlogGrid from "@components/shared/blog/BlogGrid";
import BlogCategories from "@components/shared/blog/BlogCategories";
import { Skeleton } from "@components/ui/skeleton";

export const metadata = {
  title: "The Journal | FeedMe",
  description: "Discover delicious recipes, food stories, nutrition tips, and cooking guides from FeedMe's blog. Learn about local food culture and cooking techniques.",
  keywords: "recipes, food blog, cooking tips, nutrition, food stories, Nigerian cuisine, cooking guides",
  openGraph: {
    title: "The Journal | FeedMe",
    description: "Discover delicious recipes, food stories, nutrition tips, and cooking guides from FeedMe's blog.",
    url: "https://shopfeedme.com/blog",
    siteName: "FeedMe",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Journal | FeedMe",
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
    <div className="min-h-screen bg-[#FAFAF9]">
      <BlogHero />

      <Container className="py-12 md:py-16">
        <Suspense fallback={<CategoriesSkeleton />}>
          <BlogCategories selectedCategory={category} />
        </Suspense>

        {!category && (
          <Suspense fallback={<FeaturedPostsSkeleton />}>
            <FeaturedPosts />
          </Suspense>
        )}

        <section className="mb-20">
          <div className="flex items-center justify-between mb-10">
             <h3 className="text-2xl font-serif font-bold text-[#1D2939]">
                {category ? `Category: ${category}` : "Latest Stories"}
             </h3>
             <div className="h-px flex-grow bg-gray-200 ml-6" />
          </div>
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
    <div className="flex gap-4 mb-12 overflow-x-auto pb-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-32 flex-shrink-0 rounded-full" />
      ))}
    </div>
  );
}

function FeaturedPostsSkeleton() {
  return (
    <div className="mb-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
            <Skeleton className="h-[500px] w-full rounded-[20px]" />
            <Skeleton className="h-8 w-3/4 mt-6" />
            <Skeleton className="h-4 w-full mt-3" />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-8">
            <Skeleton className="h-[240px] w-full rounded-[20px]" />
            <Skeleton className="h-[240px] w-full rounded-[20px]" />
        </div>
      </div>
    </div>
  );
}

function BlogGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-[280px] w-full rounded-[20px]" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}