"use client";

import React, { useEffect, useState } from "react";
import { getSatisfactionReviews, deleteSatisfactionReview } from "src/lib/actions/satisfaction.actions";
import { useToast } from "@/hooks/useToast";
import { 
  Star, 
  Trash2, 
  Search, 
  Filter, 
  MessageSquare, 
  Calendar, 
  User, 
  Hash, 
  TrendingUp, 
  Award,
  AlertTriangle,
  RefreshCw,
  Frown,
  Meh,
  Smile,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Review {
  id: string;
  order_id: string;
  user_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    display_name: string | null;
    email: string | null;
  } | null;
}

export default function ReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | "all">("all");
  const { showToast } = useToast();

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await getSatisfactionReviews();
      if (res.success && res.reviews) {
        setReviews(res.reviews as Review[]);
      } else {
        showToast(res.message || "Failed to load reviews", "error");
      }
    } catch (err: any) {
      showToast(err.message || "An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    let result = reviews;

    // Apply Rating filter
    if (selectedRating !== "all") {
      result = result.filter((r) => r.rating === selectedRating);
    }

    // Apply Search term filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.order_id.toLowerCase().includes(term) ||
          (r.comment && r.comment.toLowerCase().includes(term)) ||
          (r.profiles?.display_name && r.profiles.display_name.toLowerCase().includes(term)) ||
          (r.profiles?.email && r.profiles.email.toLowerCase().includes(term))
      );
    }

    setFilteredReviews(result);
  }, [reviews, searchTerm, selectedRating]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await deleteSatisfactionReview(id);
      if (res.success) {
        showToast("Review deleted successfully", "success");
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        showToast(res.message || "Failed to delete review", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to delete review", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0";
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { stars, count, percentage };
  });

  const getEmojiIcon = (rating: number) => {
    if (rating >= 4) return <Smile className="w-5 h-5 text-green-500 fill-green-50" />;
    if (rating === 3) return <Meh className="w-5 h-5 text-amber-500 fill-amber-50" />;
    return <Frown className="w-5 h-5 text-red-500 fill-red-50" />;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-outfit">
            Customer Reviews
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor and manage customer satisfaction ratings and feedback from your orders.
          </p>
        </div>
        <button
          onClick={loadReviews}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Average Rating */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Average Rating</span>
              <Award className="w-5 h-5 text-[#1B6013]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-gray-900 tracking-tight font-outfit">{averageRating}</span>
              <span className="text-gray-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(Number(averageRating))
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-200"
                  }`}
                />
              ))}
              <span className="text-xs text-gray-400 ml-2">Based on {totalReviews} reviews</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-2 text-sm text-green-600 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Active monitoring enabled</span>
          </div>
        </div>

        {/* Middle Card: Rating Distribution */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm lg:col-span-2">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider block mb-4">Rating Breakdown</span>
          <div className="space-y-3">
            {ratingDistribution.map((dist) => (
              <div key={dist.stars} className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedRating(dist.stars)}
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-amber-500 w-12 text-left"
                >
                  {dist.stars} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                </button>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${dist.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-12 text-right">
                  {dist.count} ({Math.round(dist.percentage)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters & Table Card */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search comments, users or order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6013]/20 focus:border-[#1B6013] transition-all bg-white text-gray-700"
            />
          </div>

          {/* Rating filter dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Filter rating:</span>
            <select
              value={selectedRating}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedRating(val === "all" ? "all" : Number(val));
              }}
              className="border border-gray-200 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6013]/20 focus:border-[#1B6013] bg-white text-gray-700"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#1B6013]/20 border-t-[#1B6013] rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Loading feedback data...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No reviews found</h3>
            <p className="text-gray-500 mt-1 text-sm">
              {reviews.length === 0 
                ? "You haven't received any customer satisfaction reviews yet." 
                : "No reviews match your current search queries and filters."}
            </p>
            {reviews.length > 0 && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRating("all");
                }}
                className="mt-4 text-sm font-semibold text-[#1B6013] hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Comment</th>
                  <th className="px-6 py-4">Submitted At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                <AnimatePresence>
                  {filteredReviews.map((review) => (
                    <motion.tr
                      key={review.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Customer Profile info */}
                      <td className="px-6 py-4">
                        {review.profiles ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">
                              {review.profiles.display_name || "Anonymous User"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {review.profiles.email || "No Email"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Guest Checkout</span>
                        )}
                      </td>

                      {/* Order Reference */}
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {review.order_id}
                      </td>

                      {/* Star Rating & Emotion indicator */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= review.rating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          {getEmojiIcon(review.rating)}
                        </div>
                      </td>

                      {/* Comment text */}
                      <td className="px-6 py-4 max-w-xs truncate" title={review.comment || undefined}>
                        {review.comment ? (
                          <span className="text-gray-800">{review.comment}</span>
                        ) : (
                          <span className="text-gray-300 italic">No comment left</span>
                        )}
                      </td>

                      {/* Submitted Date */}
                      <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(review.created_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={deletingId === review.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
