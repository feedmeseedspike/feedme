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
import { useState, useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { ReviewInputSchema } from "src/lib/validator";
import { z } from "zod";
import ReviewActions from "./ReviewActions";
import { createUpdateReview, getReviews } from "src/lib/actions/review.action";
import { useToast } from "src/hooks/useToast";

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
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [open, setOpen] = useState(false);
  // State to hold any error that occurs during fetching
  const [fetchError, setFetchError] = useState<string | null>(null);
  // State to keep track of expanded comments
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );

  const { showToast } = useToast();

  // Review form setup
  const form = useForm<z.infer<typeof ReviewInputSchema>>({
    resolver: zodResolver(ReviewInputSchema),
    defaultValues: reviewFormDefaultValues,
  });

  // Fetch reviews with pagination
  const fetchReviews = async (page: number) => {
    setLoadingReviews(true);
    // Clear any previous error
    setFetchError(null);
    try {
      const res = await getReviews({
        productId: product.id,
        userId: userId,
        page,
        limit: 5, // 5 reviews per page
      });

      console.log(product);
      console.log(res);

      if (res && res.data) {
        setReviews(res.data);
        setTotalPages(res.totalPages);
      } else if (res && res.message) {
        setReviews([]); 
        setTotalPages(0); 
        setFetchError(res.message); 
      } else {
        // Fallback for unexpected response structures
        setReviews([]);
        setTotalPages(0);
        setFetchError("Failed to load reviews: Unexpected response.");
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      showToast("Failed to load reviews", "error");
      setFetchError("Failed to load reviews. Please try again later.");
    } finally {
      setLoadingReviews(false);
      setInitialLoading(false);
    }
  };

  // Initial load and pagination effect
  useEffect(() => {
    if (!product.reviews) {
      fetchReviews(currentPage);
    } else {
      const formattedInitialReviews = product.reviews.map((review: any) => ({
        ...review,
        id: review.id,
        user:
          review.users && review.users.length > 0
            ? {
                id: review.users[0].id,
                name: review.users[0].display_name || "Anonymous",
                avatar: review.users[0].avatar_url || null,
              }
            : null,
        canEdit: review.canEdit,
      }));
      setReviews(formattedInitialReviews);
      if (product.num_reviews) {
        setTotalPages(Math.ceil(product.num_reviews / 5));
      }
      setInitialLoading(false);
    }
  }, [product.id, currentPage, product.reviews, product.num_reviews]);

  // Find the current user's review if it exists
  const currentUserReview = reviews.find(
    (review) => review.user?.id === userId
  );

  // Form submission with optimistic updates
  const onSubmit: SubmitHandler<z.infer<typeof ReviewInputSchema>> = async (
    values
  ) => {
    if (!userId) {
      showToast("Please sign in to submit a review", "error");
      return;
    }

    // Form submission with optimistic updates
    setOpen(false);

    try {
      console.log("UserId before createUpdateReview:", userId);
      const res = await createUpdateReview({
        data: {
          product: product.id,
          title: values.title,
          comment: values.comment,
          rating: values.rating,
          isVerifiedPurchase: true,
          // If updating, pass the existing review ID
          reviewId: currentUserReview?.id, // Pass reviewId if editing
        },
        userId,
      });

      if (!res.success) throw new Error(res.message);

      showToast(res.message || "Review submitted successfully", "success");
      // Re-fetch reviews after successful submission/update
      await fetchReviews(currentPage);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to submit review",
        "error"
      );
    } finally {
      form.reset(reviewFormDefaultValues);
    }
  };

  const handleOpenForm = async (review?: any) => {
    // If a review object is passed, it means we are editing
    if (review) {
      form.reset({
        // Pre-fill form for editing
        title: review.title,
        comment: review.comment,
        rating: review.rating,
        product: product.id,
        user: userId!, 
        isVerifiedPurchase: review.isVerifiedPurchase, 
      });
    } else {
      // Reset to default for new review
      form.reset(reviewFormDefaultValues);
      form.setValue("product", product.id);
      form.setValue("user", userId!);
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

  console.log(product.reviews);
  console.log(reviews);

  return (
    <div className="space-y-2">
      {/* Rating Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {reviews.length !== 0 &&
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
      <div className="md:grid grid-cols-9 gap-4">
        {/* Left Column - Review Form */}
        <div className="col-span-3">
          <h3 className="font-semibold text-xl">Review this product</h3>
          <p className="pt-3 h4-light">
            Share your feedback and help create a better shopping experience for
            everyone
          </p>

          {userId ? (
            // If user is logged in
            currentUserReview ? (
              // If user has already reviewed, show Edit button
              <Button
                onClick={() => handleOpenForm(currentUserReview)} // Pass existing review to pre-fill form
                variant="outline"
                className="rounded-full w-fit px-10 py-3 mt-4"
              >
                Edit your review
              </Button>
            ) : (
              // If user hasn't reviewed, show Write button
              <Dialog open={open} onOpenChange={setOpen}>
                <Button
                  onClick={() => handleOpenForm()} // No review passed for new review
                  variant="outline"
                  className="rounded-full w-fit px-10 py-3 mt-4"
                >
                  Write a customer review
                </Button>

                <DialogContent className="sm:max-w-[425px] lg:max-w-[560px]">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                      <DialogHeader>
                        <DialogTitle>Write a customer review</DialogTitle>
                        <DialogDescription>
                          Share your thoughts with other customers
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-5">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Comment</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter comment"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rating</FormLabel>
                                <Select
                                  onValueChange={(value) =>
                                    field.onChange(Number(value))
                                  }
                                  value={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a rating" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Array.from({ length: 5 }).map(
                                      (_, index) => (
                                        <SelectItem
                                          key={index}
                                          value={(index + 1).toString()}
                                        >
                                          <div className="flex items-center gap-1">
                                            {index + 1}{" "}
                                            <StarIcon className="h-4 w-4" />
                                          </div>
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="submit"
                          size="lg"
                          disabled={form.formState.isSubmitting}
                          className="bg-[#1B6013] hover:bg-[#1b6013f3] transition-all"
                        >
                          {form.formState.isSubmitting
                            ? "Submitting..."
                            : "Submit"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )
          ) : (
            <div>
              Please{" "}
              <Link
                href={`/login?callbackUrl=/product/${product.slug}`}
                className="highlight-link"
              >
                sign in
              </Link>{" "}
              to write a review
            </div>
          )}
        </div>

        {/* Right Column - Reviews List */}
        <div className="col-span-6">
          <div className="py-4">
            <Select>
              <SelectTrigger className="text-[11px] px-2 w-[133px] bg-[#F0F2F2] border-[#D5D9D9] border rounded-[7px]">
                <SelectValue placeholder="Top reviews" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Sort By</SelectLabel>
                  <SelectItem value="top">Top Reviews</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="positive">Positive First</SelectItem>
                  <SelectItem value="critical">Critical First</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {initialLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div>No reviews yet</div>
          ) : (
            <>
              {reviews.map((review) => {
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
                        src={review.users?.avatar_url || "/images/default.png"}
                        alt="User avatar"
                      />
                      <p className="text-[13px]">
                        {review.users?.display_name || "Anonymous"}
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
                    {review.isVerifiedPurchase && (
                      <p className="!text-[#12B76A] h6-light !font-bold">
                        Verified Purchase
                      </p>
                    )}
                    <p className="text-[14px] leading-[20px] text-black max-w-full">
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
                        className="text-blue-600 hover:underline text-sm mt-1"
                      >
                        {isExpanded ? "See less" : "See more"}
                      </button>
                    )}
                    <div className="flex  items-center gap-4 pt-3">
                      <ReviewActions
                        reviewId={review.id}
                        userId={userId}
                        initialHelpfulCount={review.helpfulCount ?? 0}
                        canEdit={review.canEdit}
                        initialIsHelpful={review.hasVoted}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {reviews.length > 0 && totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1 || loadingReviews}
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>

                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage >= totalPages || loadingReviews}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewList;
