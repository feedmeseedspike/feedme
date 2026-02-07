"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@components/ui/button";
import { useToast } from "src/hooks/useToast";

interface RatingFormProps {
  bundleId: string;
  currentRating?: number;
  onRatingSubmit?: () => void;
}

export default function RatingForm({ bundleId, currentRating, onRatingSubmit }: RatingFormProps) {
  const [rating, setRating] = useState(currentRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      showToast("Please select a rating", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/recipes/${bundleId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review_text: reviewText }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit rating");
      }

      showToast("Rating submitted successfully!", "success");
      setReviewText("");
      onRatingSubmit?.();
    } catch (error: any) {
      console.error("Rating error:", error);
      showToast(error.message || "Failed to submit rating", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex flex-col items-center">
        <label className="block text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">
          Rate this Recipe
        </label>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                size={36}
                strokeWidth={1.5}
                className={`${
                  star <= (hoverRating || rating)
                    ? "fill-[#F0800F] text-[#F0800F]"
                    : "text-slate-200 fill-transparent"
                } transition-colors`}
              />
            </button>
          ))}
        </div>
        <p className="h-4 text-xs font-bold text-[#F0800F] mt-2 uppercase tracking-wide">
          {rating > 0 && (
            <>
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </>
          )}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="review" className="block text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
          Review (Optional)
        </label>
        <textarea
          id="review"
          rows={3}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience..."
          className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-100 rounded-lg text-slate-900 placeholder:text-stone-400 focus:outline-none focus:border-[#F0800F] focus:bg-white transition-all resize-none text-sm font-medium"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full h-12 bg-slate-900 hover:bg-[#F0800F] text-white font-black uppercase tracking-[0.2em] text-xs transition-all shadow-md active:scale-[0.98] rounded-lg"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
