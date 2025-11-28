"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Home route error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center bg-[#F9FAFB]">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-semibold text-[#1B6013]">
          We couldn&apos;t load the page
        </h1>
        <p className="text-gray-600">
          Something went wrong while loading the homepage. Please refresh to try
          again. If the problem keeps happening, contact support and share the
          reference ID below so we can take a closer look.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-full bg-[#1B6013] text-white font-semibold hover:bg-[#15490e] transition"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-full border border-[#1B6013] text-[#1B6013] font-semibold hover:bg-[#F0FDF4] transition"
          >
            Back to home
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-500 pt-4">
            Reference ID: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}

