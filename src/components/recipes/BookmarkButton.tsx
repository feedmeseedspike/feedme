"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { useToast } from "src/hooks/useToast";

interface BookmarkButtonProps {
  bundleId: string;
  className?: string;
}

export default function BookmarkButton({
  bundleId,
  className = "",
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    checkBookmarkStatus();
  }, [bundleId]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await fetch(`/api/recipes/${bundleId}/bookmark`);
      if (!response.ok) throw new Error("Failed to check bookmark status");

      const data = await response.json();
      setIsBookmarked(data.isBookmarked);
    } catch (error) {
      console.error("Bookmark check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      const response = await fetch(`/api/recipes/${bundleId}/bookmark`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to toggle bookmark");
      }

      const data = await response.json();

      if (data.action === "added") {
        setIsBookmarked(true);
        showToast("Recipe saved to your collection!", "success");
      } else {
        setIsBookmarked(false);
        showToast("Recipe removed from collection", "success");
      }
    } catch (error: any) {
      console.error("Bookmark error:", error);
      
      if (error.message.includes("logged in")) {
        showToast("Please log in to save recipes", "error");
      } else {
        showToast(error.message || "Failed to save recipe", "error");
      }
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-400 ${className}`}
      >
        <Bookmark size={20} />
        <span className="font-bold text-sm uppercase tracking-widest">
          Save
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleBookmark}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
        isBookmarked
          ? "border-[#F0800F] bg-[#F0800F]/10 text-[#F0800F]"
          : "border-gray-200 text-gray-700 hover:border-[#F0800F] hover:text-[#F0800F]"
      } ${className}`}
    >
      <Bookmark size={20} className={isBookmarked ? "fill-current" : ""} />
      <span className="font-bold text-sm uppercase tracking-widest">
        {isBookmarked ? "Saved" : "Save"}
      </span>
    </button>
  );
}
