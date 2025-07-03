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
  const itemsPerPage = 10;
  const initialSearch = searchParams?.search || "";
  const initialTags = Array.isArray(searchParams?.tags)
    ? searchParams.tags
    : searchParams?.tags
      ? [searchParams.tags]
      : [];

  // Fetch all categories (add pagination, search, and tags filter as needed)
  const allCategories = await getAllCategories();
  // Filter and paginate server-side for now (can be optimized)
  let filtered = allCategories;
  if (initialSearch) {
    filtered = filtered.filter((cat: any) =>
      cat.title.toLowerCase().includes(initialSearch.toLowerCase())
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
    />
  );
}
