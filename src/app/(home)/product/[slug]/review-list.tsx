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
import { Textarea } from "@components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  ChevronRight,
  StarIcon,
  X,
  MessageCircleMore,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
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
  useDeleteReviewMutation,
} from "src/queries/reviews";
import { createClient } from "@utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Label } from "@components/ui/label";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import ProductGallery from "@components/shared/product/product-gallery";

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
  const [open, setOpen] = useState(false); // For the review form dialog
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const { showToast } = useToast();
  const router = useRouter();
  const user = useUser();

  const supabase = createClient();

  // Review form setup
  const form = useForm<z.infer<typeof ReviewInputSchema>>({
    resolver: zodResolver(ReviewInputSchema),
    defaultValues: reviewFormDefaultValues,
  });

  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // State for image zooming (updated for framer-motion)
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [zoomedImageUrls, setZoomedImageUrls] = useState<string[]>([]); // Array for all images in review
  const [currentZoomedImageIndex, setCurrentZoomedImageIndex] = useState(0);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([]);

  // Use Tanstack Query hooks
  const { data: reviewsData, isLoading: isLoadingReviews } = useReviewsQuery(
    product.id,
    currentPage,
    userId
  );

  const createUpdateReviewMutation = useCreateUpdateReviewMutation();
  const deleteReviewMutation = useDeleteReviewMutation();

  // Function to handle review deletion
  const handleDeleteReview = async (reviewId: string) => {
    if (!userId) {
      showToast("Please sign in to delete a review", "error");
      router.push(
        `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    try {
      // Use the new delete review mutation
      const res = await deleteReviewMutation.mutateAsync({
        reviewId,
        userId,
        productSlug: product.slug,
      });

      if (!res.success) throw new Error(res.message);

      showToast(res.message || "Review deleted successfully", "success");
      // Potentially refetch reviews or update the state to remove the deleted review
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete review",
        "error"
      );
    }
  };

  // Find the current user's review if it exists
  const currentUserReview = reviewsData?.data.find(
    (review) => review.user?.id === userId
  );

  // Function to handle deletion of existing images from state
  const handleDeleteExistingImage = (imageUrlToDelete: string) => {
    setExistingImageUrls((prev) =>
      prev.filter((url) => url !== imageUrlToDelete)
    );
  };

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
      let imageUrls: string[] = [];
      if (selectedImageFiles.length > 0) {
        setUploadingImage(true);
        try {
          const uploadPromises = selectedImageFiles.map(async (file) => {
            const fileExt = file.name.split(".").pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `review_images/${fileName}`;

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("review-images")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const {
              data: { publicUrl },
            } = supabase.storage.from("review-images").getPublicUrl(filePath);

            return publicUrl;
          });

          imageUrls = await Promise.all(uploadPromises);
        } catch (uploadError: any) {
          showToast(`Image upload failed: ${uploadError.message}`, "error");
          console.error("Upload error:", uploadError);
          setUploadingImage(false);
          return; // Stop submission if upload fails
        }
      }

      const res = await createUpdateReviewMutation.mutateAsync({
        data: {
          product: product.id,
          slug: product.slug,
          title: values.title,
          comment: values.comment,
          rating: values.rating,
          isVerifiedPurchase: true,
          image_urls: [...existingImageUrls, ...imageUrls], // Combine existing and new image URLs
        },
        userId,
      });

      if (!res.success) throw new Error(res.message);

      // Identify images to delete (original images not in existingImageUrls)
      const imagesToDelete = originalImageUrls.filter(
        (url) => !existingImageUrls.includes(url)
      );

      // Delete images from Supabase storage
      if (imagesToDelete.length > 0) {
        try {
          const filePathsToDelete = imagesToDelete.map((url) => {
            // Extract the file path from the public URL
            const urlParts = url.split("/");
            const fileName = urlParts.pop();
            const folderName = urlParts.pop();
            return `${folderName}/${fileName}`;
          });

          const { error: deleteError } = await supabase.storage
            .from("review-images")
            .remove(filePathsToDelete);

          if (deleteError) throw deleteError;
        } catch (deleteError: any) {
          console.error("Error deleting images:", deleteError);
          // Optionally show a toast or handle the error appropriately, but don't block review submission
        }
      }

      showToast(res.message || "Review submitted successfully", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to submit review",
        "error"
      );
    } finally {
      form.reset(reviewFormDefaultValues);
      setSelectedImageFiles([]);
      setUploadingImage(false);
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
        title: review.title ?? "",
        comment: review.comment ?? "",
        rating: review.rating ?? 0,
        product: product.id,
        isVerifiedPurchase: review.is_verified_purchase ?? false,
      });
      setExistingImageUrls(review.image_urls || []);
      setOriginalImageUrls(review.image_urls || []);
    } else {
      // Reset to default for new review
      form.reset(reviewFormDefaultValues);
      form.setValue("product", product.id);
      form.setValue("isVerifiedPurchase", true);
    }
    setOpen(true);
  };

  // Updated openImageDialog
  const openImageDialog = (images: string[], index: number) => {
    setZoomedImageUrls(images);
    setCurrentZoomedImageIndex(index);
    setIsImageZoomOpen(true);
  };

  // Handle keyboard escape for modal
  useEffect(() => {
    if (isImageZoomOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsImageZoomOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isImageZoomOpen]);

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
    <LayoutGroup>
      <div className="space-y-2">
        {/* Rating Summary Section */}
        <div className=" grid-cols-1 md:grid-cols-7 gap-4">
          {isLoadingReviews ? (
            <>
              <div className="p-8 flex flex-col gap-y-3 bg-gray-200 col-span-full md:col-span-3 rounded-[8px] animate-pulse">
                <div className="h-16 w-32 bg-gray-300 rounded"></div>
                <div className="h-6 w-24 bg-gray-300 rounded"></div>
                <div className="h-4 w-48 bg-gray-300 rounded"></div>
              </div>
              <div className="bg-gray-200 col-span-full md:col-span-4 rounded-[8px] p-8 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-4 bg-gray-300 rounded"></div>
                    <div className="h-4 w-full bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            (() => {
              let avgRatingToDisplay = 0;
              let numReviewsToDisplay = 0;
              let ratingDistributionToDisplay: any[] = [];

              if ((reviewsData as any)?.product_metrics) {
                avgRatingToDisplay = (reviewsData as any).product_metrics
                  .avg_rating;
                numReviewsToDisplay = (reviewsData as any).product_metrics
                  .num_reviews;
                ratingDistributionToDisplay = (reviewsData as any)
                  .product_metrics.rating_distribution;
              } else if (
                product.avg_rating !== undefined &&
                product.num_reviews !== undefined &&
                product.rating_distribution !== undefined
              ) {
                avgRatingToDisplay = product.avg_rating;
                numReviewsToDisplay = product.num_reviews;
                ratingDistributionToDisplay = product.rating_distribution;
              } else {
                return null; // No rating data to display for the summary section
              }

              // Ensure all 5 rating levels are present in ratingDistribution, even if count is 0
              const normalizedLocalRatingDistribution = Array.from(
                { length: 5 },
                (_, i) => {
                  const ratingValue = i + 1;
                  const existingEntry = ratingDistributionToDisplay.find(
                    (dist: any) => dist.rating === ratingValue
                  );
                  return {
                    rating: ratingValue,
                    count: existingEntry ? existingEntry.count : 0,
                  };
                }
              );

              return (
                <>
                  {reviewsData &&
                    reviewsData.data &&
                    reviewsData.data.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                        <div className="p-8 flex flex-col gap-y-3 bg-[#F2F4F7] col-span-full md:col-span-3 rounded-[8px]">
                          <h1 className="font-bold text-[60px] m-0">
                            {avgRatingToDisplay?.toFixed(1) || "0.0"}
                          </h1>
                          <Rating rating={avgRatingToDisplay || 0} />
                          <p className="text-[#12B76A] text-[15.25px]">
                            All from verified purchases
                          </p>
                        </div>
                        <div className="bg-[#F2F4F7] col-span-full md:col-span-4 rounded-[8px] p-8">
                          <RatingSummary
                            avgRating={avgRatingToDisplay || 0}
                            numReviews={numReviewsToDisplay || 0}
                            ratingDistribution={
                              normalizedLocalRatingDistribution
                            }
                            hideSummaryText
                          />
                        </div>
                      </div>
                    )}
                </>
              );
            })()
          )}
        </div>

        {/* Review Content Section */}
        <div className="space-y-4">
          {isLoadingReviews ? (
            <>
              {[...Array(3)].map((_, index) => (
                <div key={index} className="py-4 md:pt-0 animate-pulse">
                  <div className="flex gap-2 items-center size-[34px]">
                    <div className="rounded-full bg-gray-300 size-[34px]"></div>
                    <div className="h-4 w-24 bg-gray-300 rounded"></div>
                  </div>
                  <div className="flex gap-2 items-center max-w-full mt-2">
                    <div className="h-5 w-32 bg-gray-300 rounded"></div>
                    <div className="h-5 w-48 bg-gray-300 rounded"></div>
                  </div>
                  <div className="h-4 w-40 bg-gray-300 rounded mt-2"></div>
                  <div className="h-4 w-24 bg-gray-300 rounded mt-1"></div>
                  <div className="mt-2 space-y-2">
                    <div className="h-4 w-full bg-gray-300 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
                    <div className="h-4 w-4/6 bg-gray-300 rounded"></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="relative h-32 w-32 overflow-hidden rounded-md bg-gray-300"></div>
                    <div className="relative h-32 w-32 overflow-hidden rounded-md bg-gray-300"></div>
                  </div>
                  <div className="mt-4 h-8 w-24 bg-gray-300 rounded"></div>
                </div>
              ))}
            </>
          ) : reviewsData?.data?.length === 0 ? (
            <div className="text-center py-4 flex flex-col items-center justify-center gap-2">
              <MessageCircleMore className="h-12 w-12 text-gray-400" />
              <p className="text-lg font-medium text-gray-600">
                No reviews found for this product.
              </p>
              <p className="text-sm text-gray-500">Be the first to add one!</p>
            </div>
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
                        className="rounded-full"
                      />
                      <p className="text-[13px]">
                        {review.user?.display_name || "Anonymous"}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center max-w-full">
                      <Rating rating={review.rating ?? 0} />
                      <p className="h5-light !text-black">
                        {review.title ?? ""}
                      </p>
                    </div>
                    <p className="h5-light">
                      Reviewed on{" "}
                      {new Date(
                        review.created_at ?? new Date()
                      ).toLocaleDateString("en-US", {
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
                          ? `${review.comment?.substring(
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
                    {review.image_urls && review.image_urls.length > 0 && (
                      <div className="mt-4 flex gap-2">
                        {review.image_urls.map(
                          (imageUrl, index) =>
                            imageUrl && (
                              <motion.div
                                key={imageUrl}
                                layoutId={`review-image-${imageUrl}`}
                                onClick={() =>
                                  review.image_urls &&
                                  openImageDialog(review.image_urls, index)
                                }
                                className="relative h-32 w-32 overflow-hidden rounded-md cursor-pointer"
                              >
                                <Image
                                  src={imageUrl}
                                  alt={`Review image ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </motion.div>
                            )
                        )}
                      </div>
                    )}
                    <div className="">
                      <ReviewActions
                        reviewId={review.id}
                        initialHelpfulCount={review.helpful_count || 0}
                        userId={userId}
                        isOwner={review.canEdit}
                        onEdit={() => handleOpenForm(review)}
                        onDelete={() => handleDeleteReview(review.id)}
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
                  <div className="space-y-2">
                    <Label htmlFor="image">
                      Upload Image(s) (Optional - Max 3)
                    </Label>
                    <Input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          // Limit new uploads to the remaining slots (3 - existing images)
                          const filesArray = Array.from(e.target.files).slice(
                            0,
                            3 - existingImageUrls.length
                          );
                          setSelectedImageFiles(filesArray);
                        } else {
                          setSelectedImageFiles([]);
                        }
                      }}
                      disabled={
                        uploadingImage ||
                        createUpdateReviewMutation.isPending ||
                        existingImageUrls.length + selectedImageFiles.length >=
                          3 // Disable if max images reached
                      }
                    />
                    {/* Display Existing Images */}
                    {existingImageUrls.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {existingImageUrls.map(
                          (imageUrl, index) =>
                            imageUrl && (
                              <div
                                key={`existing-${index}`}
                                className="relative h-24 w-24 overflow-hidden rounded-md border bg-gray-100 flex items-center justify-center group"
                              >
                                {imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={`Existing review image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                ) : null}
                                {/* Delete Button */}
                                <button
                                  type="button"
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    handleDeleteExistingImage(imageUrl)
                                  }
                                  disabled={
                                    createUpdateReviewMutation.isPending
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )
                        )}
                      </div>
                    )}
                    {/* Display Newly Selected Images */}
                    {selectedImageFiles.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {selectedImageFiles.map((file, index) => (
                          <div
                            key={`selected-${index}`}
                            className="relative h-24 w-24 overflow-hidden rounded-md border bg-gray-100 flex items-center justify-center"
                          >
                            <Image
                              src={URL.createObjectURL(file)}
                              alt={`Selected review image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                    >
                      Submit Review
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

        {/* Image Zoom Modal (framer-motion based) */}
        <AnimatePresence>
          {isImageZoomOpen && zoomedImageUrls.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center bg-[#00000033] backdrop-blur-lg cursor-zoom-out"
              onClick={() => setIsImageZoomOpen(false)}
            >
              <button
                className="absolute top-4 right-4 p-2 border rounded-full bg-gray-400/40 text-white backdrop-blur-lg z-[101]"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageZoomOpen(false);
                }}
              >
                <X />
              </button>

              <motion.div
                layoutId={`review-image-${zoomedImageUrls[currentZoomedImageIndex]}`}
                className="rounded-md w-[800px] h-[500px] flex flex-col items-center justify-center cursor-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={zoomedImageUrls[currentZoomedImageIndex]}
                  width={500}
                  height={500}
                  alt="Zoomed review image"
                  className="object-contai w-[800px] min-h-[500px] rounded-md"
                />

                {/* Thumbnail Gallery in Modal */}
                <div className="flex flex-col items-center mt-4">
                  <ProductGallery
                    images={zoomedImageUrls}
                    selectedIndex={currentZoomedImageIndex}
                    onImageSelect={setCurrentZoomedImageIndex}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
};

export default ReviewList;
