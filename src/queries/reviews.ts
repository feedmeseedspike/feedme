import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@utils/supabase/client";
import { ReviewInputSchema } from "src/lib/validator";
import { z } from "zod";
import { Database } from "@utils/database.types";

type Tables = Database["public"]["Tables"];
type ReviewRow = Tables["product_reviews"]["Row"];
type UserRow = Tables["users"]["Row"];

// Types
export interface ReviewQueryResult {
  id: string;
  title: string;
  comment: string;
  rating: number;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  helpful_count: number;
  reports: any;
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
  list: (productId: string) => [...reviewKeys.lists(), productId] as const,
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
        helpful_count,
        reports,
        created_at,
        updated_at,
        user_id,
        user:users (
          id,
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
        if (!userId) {
          return {
            ...review,
            hasVoted: false,
            canEdit: false,
            user: review.user ? {
              id: review.user.id,
              display_name: review.user.display_name || 'Anonymous',
              avatar_url: review.user.avatar_url || null,
            } : null
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
          user: review.user ? {
            id: review.user.id,
            display_name: review.user.display_name || 'Anonymous',
            avatar_url: review.user.avatar_url || null,
          } : null
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
  data: z.infer<typeof ReviewInputSchema>;
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
      });

      if (error) throw error;

      return {
        success: true,
        message: "Review submitted successfully",
      };
    }
  } catch (error: any) {
    console.error("Error in createUpdateReview:", error);
    return {
      success: false,
      message: error.message || "Failed to submit review",
    };
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
    // First check if vote already exists
    const { data: existingVote } = await supabase
      .from("review_helpful_votes")
      .select("id")
      .eq("review_id", reviewId)
      .eq("user_id", userId)
      .single();

    if (existingVote) {
      return {
        success: false,
        message: "You have already voted for this review",
      };
    }

    // Insert new vote
    const { error } = await supabase.from("review_helpful_votes").insert({
      review_id: reviewId,
      user_id: userId,
    });

    if (error) throw error;

    // Update helpful count using RPC function
    const { error: rpcError } = await supabase.rpc("increment_helpful_count", {
      review_id_param: reviewId,
    });

    if (rpcError) throw rpcError;

    return {
      success: true,
      message: "Vote added successfully",
    };
  } catch (error: any) {
    console.error("Error in addHelpfulVote:", error);
    return {
      success: false,
      message: error.message || "Failed to add vote",
    };
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
    // First check if vote exists
    const { data: existingVote } = await supabase
      .from("review_helpful_votes")
      .select("id")
      .eq("review_id", reviewId)
      .eq("user_id", userId)
      .single();

    if (!existingVote) {
      return {
        success: false,
        message: "You haven't voted for this review yet",
      };
    }

    // Delete the vote
    const { error } = await supabase
      .from("review_helpful_votes")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", userId);

    if (error) throw error;

    // Update helpful count using RPC function
    const { error: rpcError } = await supabase.rpc("decrement_helpful_count", {
      review_id_param: reviewId,
    });

    if (rpcError) throw rpcError;

    return {
      success: true,
      message: "Vote removed successfully",
    };
  } catch (error: any) {
    console.error("Error in removeHelpfulVote:", error);
    return {
      success: false,
      message: error.message || "Failed to remove vote",
    };
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
    // First get the current reports array
    const { data: review, error: fetchError } = await supabase
      .from("product_reviews")
      .select("reports")
      .eq("id", reviewId)
      .single();

    if (fetchError) throw fetchError;

    // Parse existing reports or initialize empty array
    const currentReports = review?.reports || [];
    
    // Check if user has already reported
    const hasReported = currentReports.some(
      (report: any) => report.user_id === userId
    );

    if (hasReported) {
      return {
        success: false,
        message: "You have already reported this review",
      };
    }

    // Add new report
    const newReport = {
      user_id: userId,
      reason,
      created_at: new Date().toISOString(),
    };

    // Update the reports array
    const { error: updateError } = await supabase
      .from("product_reviews")
      .update({
        reports: [...currentReports, newReport],
      })
      .eq("id", reviewId);

    if (updateError) throw updateError;

    return {
      success: true,
      message: "Report submitted successfully",
    };
  } catch (error: any) {
    console.error("Error in addReport:", error);
    return {
      success: false,
      message: error.message || "Failed to submit report",
    };
  }
};

// Hooks
export const useReviewsQuery = (productId: string, page: number = 1, userId?: string) => {
  return useQuery({
    queryKey: reviewKeys.list(productId),
    queryFn: () => getReviews({ productId, page, userId }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateUpdateReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUpdateReview,
    onSuccess: (_, variables) => {
      // Invalidate reviews list for the product
      queryClient.invalidateQueries({
        queryKey: reviewKeys.list(variables.data.product),
      });
    },
  });
};

export const useAddHelpfulVoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addHelpfulVote,
    onSuccess: (_, variables) => {
      // Invalidate reviews list for the product
      queryClient.invalidateQueries({
        queryKey: reviewKeys.lists(),
      });
    },
  });
};

export const useRemoveHelpfulVoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeHelpfulVote,
    onSuccess: (_, variables) => {
      // Invalidate reviews list for the product
      queryClient.invalidateQueries({
        queryKey: reviewKeys.lists(),
      });
    },
  });
};

export const useAddReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addReport,
    onSuccess: (_, variables) => {
      // Invalidate reviews list for the product
      queryClient.invalidateQueries({
        queryKey: reviewKeys.lists(),
      });
    },
  });
}; 