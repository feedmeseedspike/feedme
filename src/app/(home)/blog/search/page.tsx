export const dynamic = "force-dynamic";

import Container from "@components/shared/Container";
import { Suspense } from "react";
import BlogSearchResults from "@components/shared/blog/BlogSearchResults";
import { Metadata } from "next";

interface BlogSearchPageProps {
  searchParams: {
    q?: string;
    page?: string;
  };
}

export async function generateMetadata({
  searchParams,
}: BlogSearchPageProps): Promise<Metadata> {
  const query = searchParams.q;
  
  if (query) {
    return {
      title: `Search results for "${query}" | FeedMe Blog`,
      description: `Search results for "${query}" in FeedMe's blog. Find recipes, cooking tips, and food stories.`,
    };
  }
  
  return {
    title: "Search | FeedMe Blog",
    description: "Search for recipes, cooking tips, food stories, and more in FeedMe's blog.",
  };
}

export default function BlogSearchPage({ searchParams }: BlogSearchPageProps) {
  const query = searchParams.q || "";
  const page = parseInt(searchParams.page || "1", 10);

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {query ? `Search results for "${query}"` : "Search Blog"}
            </h1>
            <p className="text-gray-600">
              {query 
                ? "Find the best recipes, cooking tips, and food stories matching your search."
                : "Search for recipes, cooking tips, food stories, and more."
              }
            </p>
          </div>

          {/* Search Results */}
          <Suspense fallback={<SearchResultsSkeleton />}>
            <BlogSearchResults query={query} page={page} />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
          <div className="flex gap-4">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}