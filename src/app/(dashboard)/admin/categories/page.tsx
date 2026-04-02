export const dynamic = "force-dynamic";
import CategoriesClient from "./CategoriesClient";
import { getAllCategories } from "../../../../queries/products";

function getCategoryImageUrl(thumbnail: any) {
  if (!thumbnail) return "/images/default.png";
  if (typeof thumbnail === "object" && thumbnail.url) return thumbnail.url;
  if (typeof thumbnail === "string") return thumbnail;
  return "/images/default.png";
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const itemsPerPage = 20;
  const initialSearch = searchParams?.search || "";
  const initialTags = Array.isArray(searchParams?.tags)
    ? searchParams.tags
    : searchParams?.tags
      ? [searchParams.tags]
      : [];

  // Fetch all categories
  const allCategories = await getAllCategories();
  
  // Get all unique tags for the filter sidebar
  const uniqueTags = Array.from(
    new Set(allCategories.flatMap((cat: any) => (cat.tags as string[]) || []))
  ).filter(Boolean).sort() as string[];

  // Filter and paginate server-side
  let filtered = allCategories;
  if (initialSearch) {
    filtered = filtered.filter((cat: any) =>
      cat.title?.toLowerCase().includes(initialSearch.toLowerCase())
    );
  }
  if (initialTags.length > 0) {
    filtered = filtered.filter(
      (cat: any) =>
        cat.tags && initialTags.every((tag: string) => cat.tags.includes(tag))
    );
  }

  const totalCategories = filtered.length;
  const paginated = filtered
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map((cat: any) => ({
      ...cat,
      thumbnail: getCategoryImageUrl(cat.thumbnail),
    }));

  return (
    <CategoriesClient
      initialCategories={paginated}
      totalCategories={totalCategories}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      initialSearch={initialSearch}
      initialTags={initialTags}
      allTags={uniqueTags}
    />
  );
}
