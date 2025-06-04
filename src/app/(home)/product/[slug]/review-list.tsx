"use client";

import Rating from "@components/shared/product/rating";
import RatingSummary from "@components/shared/product/rating-summary";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { ReviewInputSchema } from "src/lib/validator";
import { z } from "zod";
import ReviewActions from "./ReviewActions";
import { useToast } from "src/hooks/useToast";
import { useUser } from "src/hooks/useUser";
import { useRouter } from "next/navigation";
import {
  useReviewsQuery,
  useCreateUpdateReviewMutation,
  ReviewQueryResult,
} from "src/queries/reviews";

type ReviewListProps = {
  avgRating?: number;
  product: any;
  userId: string | undefined;
};

const reviewFormDefaultValues = {
  title: "",
  comment: "",
  rating: 0,
};

// Define a character limit for truncated comments
const COMMENT_TRUNCATE_LENGTH = 200;

const ReviewList = ({ product, userId, avgRating = 0 }: ReviewListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const { showToast } = useToast();
  const router = useRouter();
  const user = useUser();

  // Review form setup
  const form = useForm<z.infer<typeof ReviewInputSchema>>({
    resolver: zodResolver(ReviewInputSchema),
    defaultValues: reviewFormDefaultValues,
  });

  // Use Tanstack Query hooks
  const { data: reviewsData, isLoading: isLoadingReviews } = useReviewsQuery(
    product.id,
    currentPage,
    userId
  );

  const createUpdateReviewMutation = useCreateUpdateReviewMutation();

  // Find the current user's review if it exists
  const currentUserReview = reviewsData?.data.find(
    (review) => review.user?.id === userId
  );

  // Form submission with optimistic updates
  const onSubmit: SubmitHandler<z.infer<typeof ReviewInputSchema>> = async (
    values
  ) => {
    if (!userId) {
      showToast("Please sign in to submit a review", "error");
      router.push(
        `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    setOpen(false);

    try {
      const res = await createUpdateReviewMutation.mutateAsync({
        data: {
          product: product.id,
          title: values.title,
          comment: values.comment,
          rating: values.rating,
          isVerifiedPurchase: true,
          user: userId,
        },
        userId,
      });

      if (!res.success) throw new Error(res.message);

      showToast(res.message || "Review submitted successfully", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to submit review",
        "error"
      );
    } finally {
      form.reset(reviewFormDefaultValues);
    }
  };

  const handleOpenForm = async (review?: ReviewQueryResult) => {
    if (!userId) {
      showToast("Please sign in to submit a review", "error");
      router.push(
        `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    // If a review object is passed, it means we are editing
    if (review) {
      form.reset({
        // Pre-fill form for editing
        title: review.title,
        comment: review.comment,
        rating: review.rating,
        product: product.id,
        user: userId,
        isVerifiedPurchase: review.is_verified_purchase,
      });
    } else {
      // Reset to default for new review
      form.reset(reviewFormDefaultValues);
      form.setValue("product", product.id);
      form.setValue("user", userId);
      form.setValue("isVerifiedPurchase", true);
    }
    setOpen(true);
  };

  // Function to toggle comment expansion
  const toggleCommentExpansion = (reviewId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-2">
      {/* Rating Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {reviewsData?.data.length !== 0 &&
          product.avg_rating !== undefined &&
          product.num_reviews !== undefined &&
          product.rating_distribution !== undefined && (
            <>
              <div className="p-8 flex flex-col gap-y-3 bg-[#F2F4F7] col-span-3 rounded-[8px]">
                <h1 className="font-bold text-[60px] m-0">
                  {product.avg_rating.toFixed(1)}
                </h1>
                <Rating rating={product.avgRating} />
                <p className="text-[#12B76A] text-[15.25px]">
                  All from verified purchases
                </p>
              </div>
              <div className="bg-[#F2F4F7] col-span-4 rounded-[8px] p-8">
                <RatingSummary
                  avgRating={product.avg_rating}
                  numReviews={product.num_reviews}
                  ratingDistribution={product.rating_distribution}
                  hideSummaryText
                />
              </div>
            </>
          )}
      </div>

      {/* Review Content Section */}
            <div className="space-y-4">
        {isLoadingReviews ? (
          <div className="text-center py-4">Loading reviews...</div>
        ) : reviewsData?.data.length === 0 ? (
          <div className="text-center py-4">No reviews yet</div>
          ) : (
            <>
            {reviewsData?.data.map((review) => {
                // Determine if comment should be truncated
                const isCommentTooLong =
                  review.comment &&
                  review.comment.length > COMMENT_TRUNCATE_LENGTH;
                const isExpanded = expandedComments.has(review.id);

                return (
                  <div className="py-4 md:pt-0" key={review.id}>
                    <div className="flex gap-2 items-center">
                      <Image
                        width={34}
                        height={34}
                      src={review.user?.avatar_url || "/images/default.png"}
                        alt="User avatar"
                      />
                      <p className="text-[13px]">
                      {review.user?.display_name || "Anonymous"}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center max-w-full">
                      <Rating rating={review.rating} />
                      <p className="h5-light !text-black">{review.title}</p>
                    </div>
                    <p className="h5-light">
                      Reviewed on{" "}
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  {review.is_verified_purchase && (
                      <p className="!text-[#12B76A] h6-light !font-bold">
                        Verified Purchase
                      </p>
                    )}
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {isCommentTooLong && !isExpanded
                        ? `${review.comment.substring(
                            0,
                            COMMENT_TRUNCATE_LENGTH
                          )}...`
                        : review.comment}
                    </p>
                    {isCommentTooLong && (
                      <button
                        onClick={() => toggleCommentExpansion(review.id)}
                        className="text-sm text-blue-600 hover:underline mt-1"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                  <div className="mt-4">
                      <ReviewActions
                        reviewId={review.id}
                      initialHelpfulCount={review.helpful_count || 0}
                        userId={userId}
                        isOwner={review.canEdit}
                      onEdit={() => handleOpenForm(review)}
                      />
                    </div>
                  </div>
                );
              })}

            {/* Pagination */}
            {reviewsData?.totalPages && reviewsData.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                  <Button
                    variant="outline"
                  size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                  disabled={currentPage === 1}
                  >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                  </Button>
                  <span className="text-sm">
                  Page {currentPage} of {reviewsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                  size="sm"
                    onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, reviewsData.totalPages)
                    )
                    }
                  disabled={currentPage === reviewsData.totalPages}
                  >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}

        {/* Review Form Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {currentUserReview ? "Edit Your Review" : "Write a Review"}
              </DialogTitle>
              <DialogDescription>
                Share your experience with this product
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => field.onChange(value)}
                              className="focus:outline-none"
                            >
                              <StarIcon
                                className={`h-6 w-6 ${
                                  value <= field.value
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Summarize your experience"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your experience with this product"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createUpdateReviewMutation.isPending}
                  >
                    {createUpdateReviewMutation.isPending ? (
                      <>
                        <span className="mr-2">Submitting...</span>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Write Review Button */}
        {userId && !currentUserReview && (
          <Button
            onClick={() => handleOpenForm()}
            variant="outline"
            className="w-full mt-4"
          >
            Write a Review
          </Button>
        )}
        {!userId && (
          <div className="text-center mt-4">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(
                window.location.pathname
              )}`}
              className="text-blue-600 hover:underline"
            >
              Sign in
            </Link>{" "}
            to write a review
        </div>
        )}
      </div>
    </div>
  );
};

export default ReviewList;
