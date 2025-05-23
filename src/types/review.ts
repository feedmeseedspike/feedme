import { z } from "zod";

export const ReviewInputSchema = z.object({
  product: z.string(),
  user: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
  rating: z.number().min(1).max(5),
  isVerifiedPurchase: z.boolean().default(true),
});

export type ReviewInput = z.infer<typeof ReviewInputSchema>;

export interface FormattedReview {
  _id: string;
  title: string;
  comment: string;
  rating: number;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  reports: Array<{
    userId: string;
    reason: string;
    createdAt: string;
  }>;
  user: {
    _id: string;
    name: string;
    avatar: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

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
  user: {
    id: string;
    display_name: string;
    avatar_url: string;
  }[] | null;
}

export interface ReviewResponse {
  data: FormattedReview[];
  totalPages: number;
}

export interface ReviewActionResponse {
  success: boolean;
  message?: string;
}
export interface Review {
  id: string;
  productId: string;
  userId: string;
  title: string;
  comment: string;
  rating: number;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  reports: string[];
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}