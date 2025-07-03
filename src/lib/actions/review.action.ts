"use server";

import { createClient } from "src/utils/supabase/server";

interface ActionResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface ReviewQueryResult {
  id: string;
  title: string | null;
  comment: string | null;
  rating: number | null;
  is_verified_purchase: boolean | null;
  helpful_count: number | null;
  reports: any[] | null;
  image_urls: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  profiles: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Create or update a review (only owner can modify)
export async function createUpdateReview({
  data,
  userId,
}: {
  data: {
    product: string;
    title: string;
    comment: string;
    rating: number;
    isVerifiedPurchase: boolean;
    image_urls: string[] | null;
    reviewId?: string;
  };
  userId: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();

  try {
    console.log("createUpdateReview - data.product:", data.product);
    console.log("createUpdateReview - userId:", userId);
    if (data.reviewId) {
      console.log("createUpdateReview - data.reviewId:", data.reviewId);
    }

    // Check for existing review by this user for this product
    const { data: existingReview, error: fetchError } = data.reviewId
      ? { data: { id: data.reviewId, user_id: userId }, error: null }
      : await supabase
        .from("product_reviews")
        .select("id, user_id")
        .eq("product_id", data.product)
        .eq("user_id", userId)
        .maybeSingle();

    if (fetchError && !fetchError.message.includes("No rows found")) {
      throw fetchError;
    }

    if (existingReview) {
      // Only the owner can update
      if (existingReview.user_id !== userId) {
        return {
          success: false,
          message: "You can only edit your own reviews",
        };
      }

      // Update existing review
      const { error: updateError } = await supabase
        .from("product_reviews")
        .update({
          title: data.title,
          comment: data.comment,
          rating: data.rating,
          is_verified_purchase: data.isVerifiedPurchase,
          image_urls: data.image_urls,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id);

      if (updateError) throw updateError;

      return {
        success: true,
        message: "Review updated successfully",
      };
    } else {
      // Create new review
      console.log("createUpdateReview - Inserting new review with product_id:", data.product, "and user_id:", userId);
      const { error: insertError } = await supabase
        .from("product_reviews")
        .insert([{
          product_id: data.product,
          user_id: userId,
          title: data.title,
          comment: data.comment,
          rating: data.rating,
          is_verified_purchase: data.isVerifiedPurchase,
          image_urls: data.image_urls,
          helpful_count: 0,
          reports: [],
        }]);

      if (insertError) throw insertError;

      return {
        success: true,
        message: "Review created successfully",
      };
    }
  } catch (error) {
    console.error("Error in createUpdateReview:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to process review",
    };
  }
}

// Get reviews for a product
export async function getReviews({
  productId,
  page = 1,
  limit = 5,
  userId,
}: {
  productId: string;
  page?: number;
  limit?: number;
  userId?: string;
}): Promise<{
  data: any[];
  totalPages: number;
}> {
  const supabase = await createClient();

  try {
    // Get total count
    const { count } = await supabase
      .from("product_reviews")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId);

      console.log(count)
      
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
        image_urls,
        created_at,
        updated_at,
        user_id,
        profiles!inner (user_id, display_name, avatar_url)
      `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
        
    if (error) throw error;

    // Check if current user has voted on each review
    const reviewsWithVotes = await Promise.all(
      (reviews || []).map(async (review: any) => {
        if (!userId) {
             return {
                 ...review,
                 hasVoted: false,
                 canEdit: false,
                 user: review.profiles ? {
                     id: review.profiles.user_id,
                     name: review.profiles.display_name || 'Anonymous',
                     avatar_url: review.profiles.avatar_url || null,
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
          user: review.profiles ? {
            id: review.profiles.user_id,
            name: review.profiles.display_name || 'Anonymous',
            avatar_url: review.profiles.avatar_url || null,
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
}

// Helpful vote actions
export async function addHelpfulVote({
  reviewId,
  userId,
}: {
  reviewId: string;
  userId: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();

  try {
    // Check if vote already exists
    const { data: existingVote } = await supabase
      .from("review_helpful_votes")
      .select()
      .eq("review_id", reviewId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingVote) {
      return { success: false, message: "You've already voted for this review" };
    }

    // Add vote record
    const { error: voteError } = await supabase
      .from("review_helpful_votes")
      .insert({
        review_id: reviewId,
        user_id: userId,
      });

    if (voteError) throw voteError;

    // Increment count
    const { error: countError } = await supabase.rpc("increment_helpful_count", {
      review_id_param: reviewId,
    });

    if (countError) throw countError;

    return { success: true, message: "Vote added successfully" };
  } catch (error) {
    console.error("Error in addHelpfulVote:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add vote",
    };
  }
}

export async function removeHelpfulVote({
  reviewId,
  userId,
}: {
  reviewId: string;
  userId: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();

  try {
    // Remove vote record
    const { error: voteError } = await supabase
      .from("review_helpful_votes")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", userId);

    if (voteError) throw voteError;

    // Decrement count
    const { error: countError } = await supabase.rpc("decrement_helpful_count", {
      review_id_param: reviewId,
    });

    if (countError) throw countError;

    return { success: true, message: "Vote removed successfully" };
  } catch (error) {
    console.error("Error in removeHelpfulVote:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to remove vote",
    };
  }
}

// Report a review
export async function addReport({
  reviewId,
  userId,
  reason,
}: {
  reviewId: string;
  userId: string;
  reason: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();

  try {
    // Check if already reported
    const { data: review } = await supabase
      .from("product_reviews")
      .select("reports")
      .eq("id", reviewId)
      .single();

    const existingReports = Array.isArray(review?.reports) ? review.reports as Array<{ userId: string }> : [];
    const alreadyReported = existingReports.some(r => r.userId === userId);

    if (alreadyReported) {
      return { success: false, message: "You've already reported this review" };
    }

    // Add report
    const newReport = {
      userId,
      reason,
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("product_reviews")
      .update({
        reports: [...existingReports, newReport],
      })
      .eq("id", reviewId);

    if (error) throw error;

    return { success: true, message: "Report submitted successfully" };
  } catch (error) {
    console.error("Error in addReport:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to submit report",
    };
  }
}

// Delete a review (only owner can delete)
export async function deleteReview({
  reviewId,
  userId,
}: {
  reviewId: string;
  userId: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();

  try {
    // Verify ownership before deleting
    const { data: existingReview, error: fetchError } = await supabase
      .from("product_reviews")
      .select("id, user_id")
      .eq("id", reviewId)
      .single();

    if (fetchError) throw fetchError;

    if (!existingReview || existingReview.user_id !== userId) {
      return {
        success: false,
        message: "You can only delete your own reviews",
      };
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) throw deleteError;


    return { success: true, message: "Review deleted successfully" };
  } catch (error) {
    console.error("Error in deleteReview:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete review",
    };
  }
}