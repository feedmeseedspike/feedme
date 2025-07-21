import ReviewListClient from "./review-list/ReviewListClient";
import { getReviews } from "src/queries/reviews";
import { getUser } from "src/lib/actions/auth.actions";
import type { Tables } from "src/utils/database.types";
import { getUsersPurchasedProductIds } from "src/queries/products";
import { createServerComponentClient } from "src/utils/supabase/server";

interface ReviewListServerProps {
  product: Tables<"products">;
}

export default async function ReviewList({ product }: ReviewListServerProps) {
  const user = await getUser();
  const userId = user?.user_id ?? undefined;

  if (!product.id) throw new Error("Product id is required");
  const reviewsData = await getReviews({
    productId: product.id,
    userId: userId ?? "",
  });
  const avgRating = product.avg_rating || 0;

  const currentUser = user
    ? {
        display_name: user.display_name ?? undefined,
        avatar_url: user.avatar_url ?? undefined,
      }
    : null;

  let hasPurchased = false;
  if (userId) {
    const supabase = await createServerComponentClient();
    const purchasedProductIds = await getUsersPurchasedProductIds(
      supabase,
      userId
    );
    hasPurchased = purchasedProductIds.includes(product.id);
  }

  // console.log("reviewsData:", reviewsData);
  return (
    <ReviewListClient
      reviewsData={reviewsData}
      product={product}
      userId={userId ?? ""}
      avgRating={avgRating}
      currentUser={currentUser}
      hasPurchased={hasPurchased}
    />
  );
}
