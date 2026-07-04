"use server";

import { createClient } from "src/utils/supabase/server";

interface SatisfactionData {
  orderId: string;
  rating: number;
  comment?: string;
}

export async function submitOrderSatisfaction(data: SatisfactionData) {
  const supabase = await createClient();

  try {
    // 1. Get user session if logged in
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Insert satisfaction review into order_satisfaction table
    const { error } = await supabase
      .from("order_satisfaction")
      .insert({
        order_id: data.orderId,
        user_id: user?.id || null,
        rating: data.rating,
        comment: data.comment || null,
      });

    if (error) {
      console.error("Error saving order satisfaction review:", error);
      
      // Provide a helpful error if the table does not exist yet
      if (
        error.code === '42P01' ||
        error.code === 'PGRST116' || 
        error.message?.includes('relation "order_satisfaction" does not exist') ||
        error.message?.includes('relation "public.order_satisfaction" does not exist')
      ) {
        return {
          success: false,
          message: "Database table is not set up. Please run the SQL migration script (database-migration-add-order-satisfaction.sql) in your Supabase SQL editor.",
        };
      }
      return {
        success: false,
        message: error.message || "Failed to submit satisfaction review",
      };
    }

    return { success: true, message: "Thank you for your feedback!" };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to submit satisfaction review",
    };
  }
}

export async function getSatisfactionReviews() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("order_satisfaction")
      .select(`
        *,
        profiles:user_id (
          display_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading reviews:", error);
      throw error;
    }
    return { success: true, reviews: data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to load reviews",
    };
  }
}

export async function deleteSatisfactionReview(id: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("order_satisfaction")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting review:", error);
      throw error;
    }
    return { success: true, message: "Review deleted successfully" };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to delete review",
    };
  }
}
