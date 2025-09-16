"use client";

import { usePromotionsQuery } from "../../../queries/promotions";
import type { Database } from "@/utils/database.types";

type Promotion = Database["public"]["Tables"]["promotions"]["Row"];

export default function UniqueTagList() {
  const { data: promotions, isLoading, error } = usePromotionsQuery();

  // Handle loading and error states
  if (isLoading) {
    return <div>Loading tags...</div>;
  }

  if (error) {
    console.error("Error fetching promotions for tags:", error);
    return <div>Error loading tags.</div>;
  }

  // Extract unique tags from promotions
  // Use a Set to ensure uniqueness, then convert back to an array
  const uniqueTags = new Set(
    promotions?.map((promo: Promotion) => promo.tag).filter((tag: string | null): tag is string => Boolean(tag))
  ); // Filter out any potential null/undefined tags
  const tagsList = Array.from(uniqueTags);

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Unique Promotion Tags</h2>
      {tagsList.length === 0 ? (
        <p className="text-gray-500">No unique tags found yet.</p>
      ) : (
        <ul className="list-disc list-inside">
          {tagsList.map((tag: any) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
