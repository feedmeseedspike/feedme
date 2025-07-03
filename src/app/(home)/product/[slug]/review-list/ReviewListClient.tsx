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
import ReviewActions from "../ReviewActions";
import { useToast } from "src/hooks/useToast";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Label } from "@components/ui/label";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import ProductGallery from "@components/shared/product/product-gallery";
import * as reviewActions from "src/lib/actions/review.action";

const reviewFormDefaultValues = {
  title: "",
  comment: "",
  rating: 0,
};

const COMMENT_TRUNCATE_LENGTH = 200;

interface ReviewListClientProps {
  reviewsData: any;
  product: any;
  userId: string;
  avgRating?: number;
  currentUser?: { display_name?: string; avatar_url?: string } | null;
}

const ReviewListClient = ({
  reviewsData: initialReviewsData,
  product,
  userId,
  avgRating = 0,
  currentUser,
}: ReviewListClientProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [open, setOpen] = useState(false); // For the review form dialog
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const { showToast } = useToast();
  const router = useRouter();

  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [zoomedImageUrls, setZoomedImageUrls] = useState<string[]>([]);
  const [currentZoomedImageIndex, setCurrentZoomedImageIndex] = useState(0);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([]);
  const [reviewsData, setReviewsData] = useState(initialReviewsData);

  // Review form setup
  const form = useForm<z.infer<typeof ReviewInputSchema>>({
    resolver: zodResolver(ReviewInputSchema),
    defaultValues: reviewFormDefaultValues,
  });

  // Always derive currentUserReview from the latest reviewsData
  const currentUserReview = reviewsData?.data?.find(
    (review: any) => (review.user?.id ?? review.user_id) === userId
  );

  // Function to handle deletion of existing images from state
  const handleDeleteExistingImage = (imageUrlToDelete: string) => {
    setExistingImageUrls((prev) =>
      prev.filter((url) => url !== imageUrlToDelete)
    );
  };

  // Helper to refetch reviews after mutation
  const refetchReviews = async () => {
    const updated = await reviewActions.getReviews({
      productId: product.id,
      userId,
    });
    setReviewsData(updated);
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
      const res = await reviewActions.createUpdateReview({
        data: {
          product: product.id,
          title: values.title,
          comment: values.comment,
          rating: values.rating,
          isVerifiedPurchase: true,
          image_urls: Array.isArray(existingImageUrls)
            ? [...existingImageUrls]
            : [],
        },
        userId,
      });
      if (!res.success) throw new Error(res.message);
      showToast(res.message || "Review submitted successfully", "success");
      // Refetch reviews and update local state
      const updated = await reviewActions.getReviews({
        productId: product.id,
        userId,
      });
      setReviewsData(updated);
      // Debug log for review user IDs
      updated.data.forEach((review: any) => {
        console.log(
          "Review userId:",
          review.user?.id,
          "review.user_id:",
          review.user_id,
          "Current userId:",
          userId
        );
      });
      // Find the updated review and update image state
      const updatedReview = updated.data.find(
        (r: any) => (r.user?.id ?? r.user_id) === userId
      );
      setExistingImageUrls(
        Array.isArray(updatedReview?.image_urls) ? updatedReview.image_urls : []
      );
      setOriginalImageUrls(
        Array.isArray(updatedReview?.image_urls) ? updatedReview.image_urls : []
      );
    } catch (error: any) {
      showToast(error.message || "Failed to submit review", "error");
    } finally {
      form.reset(reviewFormDefaultValues);
      setSelectedImageFiles([]);
      setUploadingImage(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!userId) {
      showToast("Please sign in to delete a review", "error");
      router.push(
        `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }
    try {
      const res = await reviewActions.deleteReview({ reviewId, userId });
      if (!res.success) throw new Error(res.message);
      showToast(res.message || "Review deleted successfully", "success");
      await refetchReviews();
    } catch (error: any) {
      showToast(error.message || "Failed to delete review", "error");
    }
  };

  const handleOpenForm = async (review?: any) => {
    if (!userId) {
      showToast("Please sign in to submit a review", "error");
      router.push(
        `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }
    if (review) {
      form.reset({
        title: review.title ?? "",
        comment: review.comment ?? "",
        rating: review.rating ?? 0,
        product: product.id,
        isVerifiedPurchase: review.is_verified_purchase ?? false,
      });
      setExistingImageUrls(review.image_urls || []);
      setOriginalImageUrls(review.image_urls || []);
    } else {
      form.reset(reviewFormDefaultValues);
      form.setValue("product", product.id);
      form.setValue("isVerifiedPurchase", true);
    }
    setOpen(true);
  };

  // Fixed openImageDialog function with better validation
  const openImageDialog = (images: string[], index: number) => {
    // Filter out null/undefined/empty images
    const validImages = images.filter((img) => img && img.trim() !== "");

    if (validImages.length === 0) {
      console.warn("No valid images to display");
      return;
    }

    // Ensure index is within bounds
    const safeIndex = Math.max(0, Math.min(index, validImages.length - 1));

    setZoomedImageUrls(validImages);
    setCurrentZoomedImageIndex(safeIndex);
    setIsImageZoomOpen(true);
  };

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

  // --- Rating Distribution Normalization ---
  let avgRatingToDisplay = 0;
  let numReviewsToDisplay = 0;
  let ratingDistributionToDisplay: any[] = [];

  if (
    product.avg_rating !== undefined &&
    product.num_reviews !== undefined &&
    product.rating_distribution !== undefined
  ) {
    avgRatingToDisplay = product.avg_rating;
    numReviewsToDisplay = product.num_reviews;
    ratingDistributionToDisplay = product.rating_distribution;
  } else {
    avgRatingToDisplay = avgRating;
    numReviewsToDisplay = reviewsData?.data?.length || 0;
    ratingDistributionToDisplay = [];
  }

  const safeRatingDistribution = Array.isArray(ratingDistributionToDisplay)
    ? ratingDistributionToDisplay
    : [];
  const normalizedLocalRatingDistribution = Array.from(
    { length: 5 },
    (_, i) => {
      const ratingValue = i + 1;
      const existingEntry = safeRatingDistribution.find(
        (dist: any) => dist.rating === ratingValue
      );
      return {
        rating: ratingValue,
        count: existingEntry ? existingEntry.count : 0,
      };
    }
  );

  // Helper functions for display name and avatar
  const getDisplayName = (review: any) => {
    if (review.user?.display_name) return review.user.display_name;
    if (review.user?.name) return review.user.name;
    if (review.user_id === userId && currentUser)
      return currentUser.display_name || "You";
    return "Anonymous";
  };
  const getAvatarUrl = (review: any) => {
    if (review.user?.avatar_url) return review.user.avatar_url;
    if (review.user_id === userId && currentUser)
      return currentUser.avatar_url || "/images/default.png";
    return "/images/default.png";
  };

  return (
    <LayoutGroup>
      <div className="space-y-2">
        {/* Rating Summary Section */}
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
              ratingDistribution={normalizedLocalRatingDistribution}
              hideSummaryText
            />
          </div>
        </div>

        {/* Review Content Section */}
        <div className="space-y-4">
          {reviewsData?.data?.length === 0 ? (
            <div className="text-center py-4 flex flex-col items-center justify-center gap-2">
              <MessageCircleMore className="h-12 w-12 text-gray-400" />
              <p className="text-lg font-medium text-gray-600">
                No reviews found for this product.
              </p>
              <p className="text-sm text-gray-500">Be the first to add one!</p>
            </div>
          ) : (
            <>
              {reviewsData?.data.map((review: any) => {
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
                        src={getAvatarUrl(review)}
                        alt="User avatar"
                        className="rounded-full"
                      />
                      <p className="text-[13px]">{getDisplayName(review)}</p>
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
                          ? `${review.comment?.substring(0, COMMENT_TRUNCATE_LENGTH)}...`
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
                    {/* Fixed Review Images Section */}
                    {review.image_urls && review.image_urls.length > 0 && (
                      <div className="mt-4 flex gap-2">
                        {review.image_urls
                          .filter(
                            (imageUrl: string) =>
                              imageUrl && imageUrl.trim() !== ""
                          ) // Filter out invalid URLs
                          .map((imageUrl: string, index: number) => (
                            <motion.div
                              key={`${review.id}-${imageUrl}-${index}`} // More unique key
                              layoutId={`review-image-${imageUrl}`}
                              onClick={() => {
                                const validImages = review.image_urls.filter(
                                  (url: string) => url && url.trim() !== ""
                                );
                                const actualIndex =
                                  validImages.indexOf(imageUrl);
                                openImageDialog(validImages, actualIndex);
                              }}
                              className="relative h-32 w-32 overflow-hidden rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                            >
                              <Image
                                src={imageUrl}
                                alt={`Review image ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="128px"
                                onError={(e) => {
                                  console.error(
                                    "Review image failed to load:",
                                    imageUrl
                                  );
                                  // Optionally hide the image container or show a placeholder
                                }}
                              />
                            </motion.div>
                          ))}
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
                      setCurrentPage((prev: number) => Math.max(prev - 1, 1))
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
                      setCurrentPage((prev: number) =>
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
                                  className={`h-6 w-6 ${value <= field.value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
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
                        existingImageUrls.length + selectedImageFiles.length >=
                          3
                      }
                    />
                    <div className="flex gap-2">
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
                                    disabled={uploadingImage}
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
                        <div className="mt-2 flex flex-row gap-2">
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

          {/* Write Review Button - only show if user is logged in and does NOT have a review */}
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
                href={`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`}
                className="text-blue-600 hover:underline"
              >
                Sign in
              </Link>{" "}
              to write a review
            </div>
          )}
        </div>

        {/* Fixed Image Zoom Modal */}
        <AnimatePresence>
          {isImageZoomOpen &&
            zoomedImageUrls.length > 0 &&
            currentZoomedImageIndex < zoomedImageUrls.length && (
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

                {/* Add validation for the current image */}
                {zoomedImageUrls[currentZoomedImageIndex] && (
                  <motion.div
                    layoutId={`review-image-${zoomedImageUrls[currentZoomedImageIndex]}`}
                    className="rounded-md w-[800px] h-[500px] flex flex-col items-center justify-center cursor-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative w-[800px] h-[500px]">
                      <Image
                        src={zoomedImageUrls[currentZoomedImageIndex]}
                        alt="Zoomed review image"
                        fill
                        className="object-contain rounded-md"
                        sizes="800px"
                        priority
                        onError={(e) => {
                          console.error(
                            "Image failed to load:",
                            zoomedImageUrls[currentZoomedImageIndex]
                          );
                          setIsImageZoomOpen(false);
                        }}
                      />
                    </div>

                    {/* Thumbnail Gallery in Modal */}
                    <div className="flex flex-col items-center mt-4">
                      <ProductGallery
                        images={zoomedImageUrls}
                        selectedIndex={currentZoomedImageIndex}
                        onImageSelect={setCurrentZoomedImageIndex}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
};

export default ReviewListClient;

// "environments": [
//   {
//     "name": "ATLAS_API_CLIENT_ID",
//     "value": "yghshqcz"
//   },
//   {
//     "name": "ATLAS_API_CLIENT_SECRET",
//     "value": "cccbeb2e-36e3-4e8e-8505-050d97bfa9c7"
//   }
// ]
