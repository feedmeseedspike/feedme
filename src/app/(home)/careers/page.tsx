"use client";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function CareersComingSoon() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-16">
      <div className="flex justify-center mb-4">
        <Sparkles className="text-yellow-500 w-16 h-16" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        Careers - Coming Soon!
      </h1>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        We&apos;re working hard to launch our careers page. Please check back
        soon for exciting opportunities to join our team!
      </p>
      <Link href="/">
        <button className="bg-[#1B6013] text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-[#14510f] transition-all duration-200">
          Back to Home
        </button>
      </Link>
    </div>
  );
}
