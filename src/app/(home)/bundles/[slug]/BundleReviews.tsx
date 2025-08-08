import ReviewList from "../../product/[slug]/review-list";

interface BundleReviewsProps {
  bundle: any;
}

export default async function BundleReviews({ bundle }: BundleReviewsProps) {
  return (
    <section className="mt-6">
      <h2 className="h2-bold mb-2" id="reviews">
        Customer Reviews (
        {bundle.num_reviews || 0})
      </h2>
      <ReviewList product={bundle} />
    </section>
  );
}