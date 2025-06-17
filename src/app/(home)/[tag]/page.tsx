"use client";

import { useSearchParams, useParams } from "next/navigation";
import Pagination from "@components/shared/pagination";
import ProductSortSelector from "@components/shared/product/product-sort-selector";
import Container from "@components/shared/Container";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
import { ProductSkeletonGrid } from "@components/shared/product/product-skeleton";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@utils/supabase/client";
import { getAllProducts as getAllProductsQuery } from "../../../queries/products";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import {
  usePromotionByTagQuery,
  useProductsByTagQuery,
} from "../../../queries/promotions";
import NotFound from "../../not-found";
import { mapSupabaseProductToIProductInput, CategoryData } from "src/lib/utils";
import { IProductInput } from "src/types";
import { getAllCategoriesQuery } from "../../../queries/categories";

const sortOrders = [
  { value: "price-low-to-high", name: "Price: Low to high" },
  { value: "price-high-to-low", name: "Price: High to low" },
  { value: "newest-arrivals", name: "Newest arrivals" },
  { value: "best-selling", name: "Best selling" },
];

const SPECIAL_TAGS = [
  "new-arrival",
  "best-seller",
  "fresh-fruits",
  "fresh-vegetables",
  "todays-deal",
];

export default function TagPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const tag = params.tag as string;
  const sort = searchParams.get("sort") || "best-selling";
  const page = Number(searchParams.get("page")) || 1;

  const isSpecialTag = SPECIAL_TAGS.includes(tag);

  // Fetch all categories for product mapping
  const { data: allCategories } = useQuery({
    queryKey: ["allCategories"],
    queryFn: async () => {
      const { data, error } = await getAllCategoriesQuery(supabase);
      if (error) {
        console.error("Error fetching all categories:", error);
        return [];
      }
      return data as CategoryData[];
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const {
    data: specialTagProducts,
    isLoading: isSpecialLoading,
    error: specialError,
  } = useQuery({
    queryKey: ["tag-products", tag, page, sort],
    queryFn: async () => {
      try {
        const data = await getAllProductsQuery(supabase, { tag, page, sort });
        return data;
      } catch (e) {
        console.error("TagPage: Error in specialTagProducts queryFn:", e);
        throw e;
      }
    },
    enabled: isSpecialTag,
  });

  const {
    data: promotionData,
    isLoading: isPromotionLoading,
    error: promotionError,
  } = usePromotionByTagQuery(tag, {
    enabled: true,
  });

  const {
    data: promotionProducts,
    isLoading: isPromotionProductsLoading,
    error: promotionProductsError,
  } = useProductsByTagQuery(tag, page, sort);

  const productsToDisplay: IProductInput[] =
    (isSpecialTag
      ? specialTagProducts?.products
      : promotionProducts?.products
    )?.map((product) =>
      mapSupabaseProductToIProductInput(product, allCategories || [])
    ) || [];

  const totalProducts = isSpecialTag
    ? specialTagProducts?.totalProducts || 0
    : promotionProducts?.totalCount || 0;

  const totalPages = Math.ceil(totalProducts / 10);
  const isLoading = isSpecialTag
    ? isSpecialLoading
    : isPromotionLoading || isPromotionProductsLoading;
  const error = isSpecialTag
    ? specialError
    : promotionError || promotionProductsError;

  const pageTitle = isSpecialTag
    ? tag === "new-arrival"
      ? "New Arrivals"
      : tag === "best-seller"
      ? "Best Sellers"
      : tag === "fresh-fruits"
      ? "Fresh Fruits"
      : "Fresh Vegetables"
    : promotionData?.title ||
      tag
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

  if (isLoading) {
    return (
      <main>
        {promotionData && (
          <div className="w-full relative overflow-hidde mb-4">
            <Image
              src={promotionData.image_url || "/images/placeholder-banner.jpg"}
              alt={promotionData.title || "Promotion banner"}
              width={1000}
              height={1000}
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="bg-white py-4">
          <Container>
            <CustomBreadcrumb />
          </Container>
        </div>
        <div className="py-2 px-4 md:border-b shadow-sm">
          <Container>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center">
                <h1 className="text-[#1B6013] text-2xl md:text-3xl font-bold">
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
        <Container className="py-8">
          <ProductSkeletonGrid count={10} />
        </Container>
      </main>
    );
  }

  if (error) {
    console.error("Error fetching data:", error);
    return (
      <div className="text-center py-10 text-red-600">
        Error loading {isSpecialTag ? "products" : "promotion data"}.
      </div>
    );
  }

  if (!isSpecialTag && !promotionData) {
    return <NotFound />;
  }

  return (
    <main className="min-h-screen">
      {promotionData && (
        <div
          className="w-full relative overflow-hidde mb-4"
          style={{
            backgroundColor: promotionData.background_color || "#ffffff",
          }}
        >
          <Image
            src={promotionData.image_url || "/images/placeholder-banner.jpg"}
            alt={promotionData.title || "Promotion banner"}
            width={1000}
            height={1000}
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="bg-white py-4">
        <Container>
          <CustomBreadcrumb />
        </Container>
      </div>
      <div className="py-2 px-4 md:border-b shadow-sm">
        <Container>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center">
              <h1 className="text-[#1B6013] text-2xl md:text-3xl font-bold">
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
