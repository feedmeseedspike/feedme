import Container from "@components/shared/Container";
import Link from "next/link";

export default function BlogNotFound() {
  return (
    <div className="min-h-screen bg-white">
      <Container className="py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Blog Post Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Sorry, the blog post you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          <div className="space-x-4">
            <Link
              href="/blog"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Browse All Posts
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Go Home
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}