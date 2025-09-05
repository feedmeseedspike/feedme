export default function BlogPostSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Category badge */}
      <div className="h-6 w-24 bg-gray-200 rounded-full mb-4"></div>
      
      {/* Title */}
      <div className="space-y-3 mb-6">
        <div className="h-12 bg-gray-200 rounded w-full"></div>
        <div className="h-12 bg-gray-200 rounded w-3/4"></div>
      </div>
      
      {/* Excerpt */}
      <div className="space-y-2 mb-6">
        <div className="h-6 bg-gray-200 rounded w-full"></div>
        <div className="h-6 bg-gray-200 rounded w-2/3"></div>
      </div>
      
      {/* Meta info */}
      <div className="flex gap-6 mb-8">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-4 mb-8 pb-8 border-b">
        <div className="h-10 w-20 bg-gray-200 rounded-full"></div>
        <div className="h-10 w-20 bg-gray-200 rounded-full"></div>
      </div>
      
      {/* Featured image */}
      <div className="h-96 bg-gray-200 rounded-xl mb-8"></div>
      
      {/* Content */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
      
      {/* Tags */}
      <div className="mt-8 pt-8 border-t">
        <div className="h-4 w-12 bg-gray-200 rounded mb-3"></div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-16 bg-gray-200 rounded-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}