export const dynamic = "force-dynamic";
import ProductsClient from "./ProductsClient";
import { getProducts, getAllCategories } from "../../../../queries/products";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const itemsPerPage = 10;
  const initialSearch = searchParams?.search || "";
  const initialCategories = Array.isArray(searchParams?.category)
    ? searchParams.category
    : searchParams?.category
      ? [searchParams.category]
      : [];
  const initialStock = Array.isArray(searchParams?.stock)
    ? searchParams.stock
    : searchParams?.stock
      ? [searchParams.stock]
      : [];
  const initialPublished = Array.isArray(searchParams?.published)
    ? searchParams.published
    : searchParams?.published
      ? [searchParams.published]
      : [];

  // Handle sort parameters
  const sortBy = searchParams?.sortBy || "created_at";
  const sortOrder = searchParams?.sortOrder || "desc";

  const { data: initialProducts, count: totalProductsCount } =
    await getProducts({
      page: currentPage,
      limit: itemsPerPage,
      search: initialSearch,
      category: initialCategories[0] || "",
      stockStatus: initialStock[0] || "",
      publishedStatus: initialPublished[0] || "",
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    });

  // Collect all unique category IDs from products
  const allCategoryIds = Array.from(
    new Set(
      (initialProducts || [])
        .flatMap((p: any) =>
          Array.isArray(p.category_ids) ? p.category_ids : []
        )
        .filter(Boolean)
    )
  );

  // Fetch all categories in one go
  const allCategories = await getAllCategories();
  let categoryNames: Record<string, string> = {};
  if (allCategoryIds.length > 0) {
    for (const cat of allCategories) {
      if (allCategoryIds.includes(cat.id)) {
        categoryNames[cat.id] = cat.title;
      }
    }
  }

  return (
    <ProductsClient
      initialProducts={initialProducts || []}
      totalProductsCount={totalProductsCount || 0}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      initialSearch={initialSearch}
      initialCategories={initialCategories}
      initialStock={initialStock}
      initialPublished={initialPublished}
      categoryNames={categoryNames}
      allCategories={allCategories}
      initialSortBy={sortBy}
      initialSortOrder={sortOrder}
    />
  );
}
