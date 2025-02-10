import { products } from "src/lib/data";
import { ReviewInputSchema } from "src/lib/validator";
import { z } from "zod";

export async function createUpdateReview({
  data,
  path,
}: {
  data: z.infer<typeof ReviewInputSchema>;
  path: string;
}) {
  try {
    const review = ReviewInputSchema.parse(data);

    // Find the product
    const product = products.find((p) => p.slug === review.product);
    if (!product) {
      throw new Error("Product not found");
    }

    // Check if the review exists
    const existingReviewIndex = product.reviews.findIndex(
      (r) => r.user === review.user
    );

    if (existingReviewIndex !== -1) {
      // Update existing review
      product.reviews[existingReviewIndex] = review;
      return {
        success: true,
        message: "Review updated successfully",
      };
    } else {
      // Add new review
      product.reviews.push(review);
      return {
        success: true,
        message: "Review created successfully",
      };
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: error.message,
    };
  }
}

export async function getReviews({
  productId,
  limit,
  page,
}: {
  productId: string;
  limit?: number;
  page: number;
}) {
  const product = products.find((p) => p.slug === productId);
  if (!product) {
    return { data: [], totalPages: 1 };
  }

  const totalReviews = product.reviews.length;
  const totalPages = totalReviews === 0 ? 1 : Math.ceil(totalReviews / (limit || 10));

  return {
    data: product.reviews.slice((page - 1) * (limit || 10), page * (limit || 10)),
    totalPages,
  };
}

export const getReviewByProductId = async ({
  productId,
  userId,
}: {
  productId: string;
  userId: string;
}) => {
  const product = products.find((p) => p.slug === productId);
  if (!product) return null;

  const review = product.reviews.find((r) => r.user === userId);
  return review || null;
};

