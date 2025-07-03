import ReviewListClient from "./review-list/ReviewListClient";
import { getReviews } from "src/queries/reviews";
import { getUser } from "src/lib/actions/auth.actions";
import type { Tables } from "src/utils/database.types";

interface ReviewListServerProps {
  product: Tables<"products">;
}

export default async function ReviewList({ product }: ReviewListServerProps) {
  const user = await getUser();
  console.log("reviews list", user);
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

  // console.log("reviewsData:", reviewsData);
  return (
    <ReviewListClient
      reviewsData={reviewsData}
      product={product}
      userId={userId ?? ""}
      avgRating={avgRating}
      currentUser={currentUser}
    />
  );
}
