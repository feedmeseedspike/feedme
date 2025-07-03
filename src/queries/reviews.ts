import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@utils/supabase/client";
import { ReviewInputSchema } from "src/lib/validator";
import { z } from "zod";
import { Database, Json } from "@utils/database.types";
// import { revalidateProductPage } from "src/lib/actions/product.actions";

type Tables = Database["public"]["Tables"];
type ReviewRow = Tables["product_reviews"]["Row"];
type UserProfileRow = Tables["profiles"]["Row"];

// Types
export interface ReviewQueryResult {
  id: string;
  title: string | null;
  comment: string | null;
  rating: number | null;
  is_verified_purchase: boolean | null;
  image_urls: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  helpful_count: number | null;
  reports: Json | null;
  user_id: string;
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  hasVoted?: boolean;
  canEdit?: boolean;
}

export interface ReviewsResponse {
  data: ReviewQueryResult[];
  totalPages: number;
}

// Query Keys
export const reviewKeys = {
  all: ["reviews"] as const,
  lists: () => [...reviewKeys.all, "list"] as const,
  list: (productId: string, page: number) => [...reviewKeys.lists(), productId, page] as const,
  detail: (reviewId: string) => [...reviewKeys.all, "detail", reviewId] as const,
};

// Get reviews for a product
export const getReviews = async ({
  productId,
  page = 1,
  limit = 5,
  userId,
}: {
  productId: string;
  page?: number;
  limit?: number;
  userId?: string;
}): Promise<ReviewsResponse> => {
  const supabase = await createClient();

  try {
    // Get total count
    const { count } = await supabase
      .from("product_reviews")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId);

    const totalPages = count ? Math.ceil(count / limit) : 1;

    // Get paginated reviews with user info
    const { data: reviews, error } = await supabase
      .from("product_reviews")
      .select(`
        id,
        title,
        comment,
        rating,
        is_verified_purchase,
        image_urls,
        helpful_count,
        reports,
        created_at,
        updated_at,
        user_id,
        user:profiles (
          user_id: user_id,
          display_name,
          avatar_url
        )
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    // Check if current user has voted on each review
    const reviewsWithVotes = await Promise.all(
      (reviews || []).map(async (review) => {
        let userProfile: UserProfileRow | null = null;
        if (review.user) {
          if (Array.isArray(review.user)) {
            userProfile = review.user.length > 0 ? review.user[0] as UserProfileRow : null;
          } else if (typeof review.user === 'object') {
            userProfile = review.user as UserProfileRow;
          }
        }

        if (!userId) {
          return {
            ...review,
            hasVoted: false,
            canEdit: false,
            user: userProfile
              ? {
                  id: userProfile.user_id,
                  display_name: userProfile.display_name || 'Anonymous',
                  avatar_url: userProfile.avatar_url || null,
                }
              : null,
          };
        }

        const { data: vote } = await supabase
          .from("review_helpful_votes")
          .select()
          .eq("review_id", review.id)
          .eq("user_id", userId)
          .maybeSingle();

        return {
          ...review,
          hasVoted: !!vote,
          canEdit: review.user_id === userId,
          user: userProfile
            ? {
                id: userProfile.user_id,
                display_name: userProfile.display_name || 'Anonymous',
                avatar_url: userProfile.avatar_url || null,
              }
            : null,
        };
      })
    );

    return {
      data: reviewsWithVotes,
      totalPages,
    };
  } catch (error) {
    console.error("Error in getReviews:", error);
    return {
      data: [],
      totalPages: 1,
    };
  }
};

// Create or update a review
export const createUpdateReview = async ({
  data,
  userId,
}: {
  data: z.infer<typeof ReviewInputSchema> & { slug: string };
  userId: string;
}) => {
  const supabase = await createClient();

  try {
    const { data: existingReview } = await supabase
      .from("product_reviews")
      .select()
      .eq("product_id", data.product)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingReview) {
      // Update existing review
      const { error } = await supabase
        .from("product_reviews")
        .update({
          title: data.title,
          comment: data.comment,
          rating: data.rating,
          image_urls: data.image_urls,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id);

      if (error) throw error;

      return {
        success: true,
        message: "Review updated successfully",
      };
    } else {
      // Create new review
      const { error } = await supabase.from("product_reviews").insert({
        product_id: data.product,
        user_id: userId,
        title: data.title,
        comment: data.comment,
        rating: data.rating,
        is_verified_purchase: data.isVerifiedPurchase,
        image_urls: data.image_urls,
      });

      if (error) throw error;

      return {
        success: true,
        message: "Review submitted successfully",
      };
    }
  } catch (error: any) {
    console.error("Error creating/updating review:", error);
    throw new Error(error.message || "Failed to create/update review");
  }
};

// Add helpful vote
export const addHelpfulVote = async ({
  reviewId,
  userId,
}: {
  reviewId: string;
  userId: string;
}) => {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("review_helpful_votes")
      .insert({ review_id: reviewId, user_id: userId });
    if (error) throw error;
    // Increment helpful_count in product_reviews table
    const { error: updateError } = await supabase.rpc(
      "increment_helpful_count",
      { review_id_param: reviewId }
    );
    if (updateError) throw updateError;
  } catch (error: any) {
    console.error("Error adding helpful vote:", error);
    throw new Error(error.message || "Failed to add helpful vote");
  }
};

// Remove helpful vote
export const removeHelpfulVote = async ({
  reviewId,
  userId,
}: {
  reviewId: string;
  userId: string;
}) => {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("review_helpful_votes")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", userId);
    if (error) throw error;
    // Decrement helpful_count in product_reviews table
    const { error: updateError } = await supabase.rpc(
      "decrement_helpful_count",
      { review_id_param: reviewId }
    );
    if (updateError) throw updateError;
  } catch (error: any) {
    console.error("Error removing helpful vote:", error);
    throw new Error(error.message || "Failed to remove helpful vote");
  }
};

// Add report
export const addReport = async ({
  reviewId,
  userId,
  reason,
}: {
  reviewId: string;
  userId: string;
  reason: string;
}) => {
  const supabase = await createClient();

  try {
    // Fetch existing reports
    const { data: existingReview, error: fetchError } = await supabase
      .from("product_reviews")
      .select("reports")
      .eq("id", reviewId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const currentReports = (existingReview?.reports || []) as { user_id: string; reason: string; created_at: string }[];

    // Add new report
    const updatedReports = [
      ...currentReports,
      { user_id: userId, reason, created_at: new Date().toISOString() },
    ];

    const { error } = await supabase
      .from("product_reviews")
      .update({ reports: updatedReports as any })
      .eq("id", reviewId);

    if (error) throw error;

    return {
      success: true,
      message: "Review reported successfully",
    };
  } catch (error: any) {
    console.error("Error adding report:", error);
    throw new Error(error.message || "Failed to add report");
  }
};

// Delete a review
export const deleteReview = async ({
  reviewId,
  userId,
  productSlug,
}: {
  reviewId: string;
  userId: string;
  productSlug: string;
}) => {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", userId);

    if (error) throw error;

    return {
      success: true,
      message: "Review deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting review:", error);
    throw new Error(error.message || "Failed to delete review");
  }
};

// Hooks
export const useReviewsQuery = (productId: string, page: number = 1, userId?: string) => {
  return useQuery({
    queryKey: reviewKeys.list(productId, page),
    queryFn: () => getReviews({ productId, page, userId }),
    enabled: !!productId,
  });
};

export const useCreateUpdateReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUpdateReview,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.list(variables.data.product, 1),
      });
      // Revalidate the product page to update avg_rating and rating_distribution
      // await revalidateProductPage(variables.data.slug);
    },
  });
};

export const useAddHelpfulVoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addHelpfulVote,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(variables.reviewId),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
    },
  });
};

export const useRemoveHelpfulVoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeHelpfulVote,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(variables.reviewId),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
    },
  });
};

export const useAddReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addReport,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(variables.reviewId),
      });
    },
  });
};

// Use mutation for deleting a review
export const useDeleteReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReview,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });

      // Revalidate the product page to update avg_rating and rating_distribution
      // await revalidateProductPage(variables.productSlug);
    },
  });
}; 