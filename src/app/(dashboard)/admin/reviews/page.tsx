import ReviewsClient from "./ReviewsClient";

export const metadata = {
  title: "Customer Reviews | Admin Dashboard",
  description: "View and manage customer satisfaction ratings and feedback.",
};

export default function AdminReviewsPage() {
  return (
    <div className="container mx-auto py-2">
      <ReviewsClient />
    </div>
  );
}
