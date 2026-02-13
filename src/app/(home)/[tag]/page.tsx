export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Pagination from "@components/shared/pagination";
import ProductSortSelector from "@components/shared/product/product-sort-selector";
import Container from "@components/shared/Container";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
import { ProductSkeletonGrid } from "@components/shared/product/product-skeleton";
import Image from "next/image";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import NotFound from "../../not-found";
import { mapSupabaseProductToIProductInput, CategoryData } from "src/lib/utils";
import { IProductInput } from "src/types";
import { getAllProducts as getAllProductsQuery } from "../../../queries/products";
import { getAllCategoriesQuery } from "../../../queries/categories";
import {
  getPromotionByTag,
  getProductsByTag,
} from "src/lib/actions/promotion.actions";
import { createServerComponentClient } from "src/utils/supabase/server";

const sortOrders = [
  { value: "price-low-to-high", name: "Price: Low to high" },
  { value: "price-high-to-low", name: "Price: High to low" },
  { value: "newest-arrivals", name: "Newest barrivals" },
  { value: "best-selling", name: "Best selling" },
];

const SPECIAL_TAGS = [
  "new-arrival",
  "best-seller",
  "fresh-fruits",
  "fresh-vegetables",
  "todays-deal",
  "trending",
  "fresh-seeds-and-nuts",
];

export default async function TagPage({
  params,
  searchParams,
}: {
  params: { tag: string };
  searchParams: { [key: string]: string };
}) {
  const tag = params.tag;
  const sort = searchParams.sort || "best-selling";
  const page = Number(searchParams.page) || 1;
  const isSpecialTag = SPECIAL_TAGS.includes(tag);

  const supabase = await createServerComponentClient();

  // Fetch all categories
  const { data: allCategoriesData, error: categoriesError } =
    await getAllCategoriesQuery(supabase);
  const allCategories = (allCategoriesData as CategoryData[]) || [];

  let specialTagProducts = null;
  let promotionData = null;
  let promotionProducts = null;
  let error = null;

  let limit = 10;
  let maxTotal = undefined;
  if (tag === "new-arrival") {
    limit = 20;
    maxTotal = 50;
  }

  if (isSpecialTag) {
    try {
      specialTagProducts = await getAllProductsQuery(supabase, {
        tag,
        page,
        sort,
        limit: maxTotal ?? limit,
      });
      // For new-arrival, slice to only the first 50 products and paginate
      if (tag === "new-arrival" && specialTagProducts?.products) {
        const allProducts = specialTagProducts.products.slice(0, maxTotal);
        const paginatedProducts = allProducts.slice(
          (page - 1) * limit,
          page * limit
        );
        specialTagProducts.products = paginatedProducts;
        specialTagProducts.totalProducts = Math.min(
          specialTagProducts.totalProducts,
          maxTotal ?? limit
        );
      }
    } catch (e: any) {
      error = e;
    }
  } else {
    try {
      promotionData = await getPromotionByTag(tag);
      promotionProducts = await getProductsByTag({ tag, page, sort });
    } catch (e: any) {
      error = e;
    }
  }

  const productsToDisplay: IProductInput[] =
    (isSpecialTag
      ? specialTagProducts?.products
      : promotionProducts?.products
    )?.map((product: any) =>
      mapSupabaseProductToIProductInput(product, allCategories)
    ) || [];

  const totalProducts = isSpecialTag
    ? specialTagProducts?.totalProducts || 0
    : promotionProducts?.totalCount || 0;

  const totalPages = Math.ceil(totalProducts / limit);

  const pageTitle = isSpecialTag
    ? tag === "new-arrival"
      ? "New Arrivals"
      : tag === "best-seller"
        ? "Best Sellers"
        : tag === "fresh-fruits"
          ? "Fresh Fruits"
          : tag === "fresh-vegetables"
            ? "Fresh Vegetables"
            : tag === "todays-deal"
              ? "Today's Deal"
              : tag === "trending"
                ? "Trending"
                : tag
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")
    : promotionData?.title ||
      tag
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

  if (error) {
    console.error("Error fetching data:", error);
    return (
      <div className="text-center py-10 text-red-600">
        Error loading {isSpecialTag ? "products" : "promotion data"}.
      </div>
    );
  }

  if (!isSpecialTag && !promotionData) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <div className="md:border-b shadow-sm">
        <div className="bg-white py-4">
          <Container>
            <CustomBreadcrumb />
          </Container>
        </div>
        <Container>
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-[#1B6013] text-2xl md:text-3xl !leading-5 font-bold">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center">
              <ProductSortSelector
                sortOrders={sortOrders}
                sort={sort}
                params={{ tag, sort, page: String(page) }}
              />
            </div>
          </div>
        </Container>
      </div>
      <Container>
        {promotionData && (
          <div
            className="w-full h-[40vh] relative overflow-hidden my-4"
          >
            <Image
              src={promotionData.image_url || "/images/placeholder-banner.jpg"}
              alt={promotionData.title || "Promotion banner"}
              width={1000}
              height={1000}
              className="object-cover size-full"
              priority
            />
          </div>
        )}
      </Container>
      <Container className="py-8">
        {productsToDisplay.length === 0 ? (
          <p className="text-center text-gray-500">
            No products found for this category.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {productsToDisplay.map((product) => (
              <ProductdetailsCard
                key={product.id}
                product={product}
                tag={tag}
              />
            ))}
          </div>
        )}
        {totalPages > 1 && productsToDisplay.length > 0 && (
          <div className="mt-8">
            <Pagination totalPages={totalPages} page={page} />
          </div>
        )}
      </Container>
    </main>
  );
}
