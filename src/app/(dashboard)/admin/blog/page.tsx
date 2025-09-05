export const dynamic = "force-dynamic";

import { Suspense } from "react";
import BlogManager from "@components/admin/blog/BlogManager";

export const metadata = {
  title: "Blog Management | FeedMe Admin",
  description: "Manage blog posts, categories, and content for the FeedMe blog.",
};

export default function BlogAdminPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog Management</h1>
        <p className="text-gray-600">Create, edit, and manage your blog posts and categories.</p>
      </div>

      <Suspense fallback={<BlogManagerSkeleton />}>
        <BlogManager />
      </Suspense>
    </div>
  );
}

function BlogManagerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
            <div className="h-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}