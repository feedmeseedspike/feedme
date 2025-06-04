"use client";

import { useSearchParams, useParams } from "next/navigation";
import Pagination from "@components/shared/pagination";
import ProductSortSelector from "@components/shared/product/product-sort-selector";
import Container from "@components/shared/Container";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
import { ProductSkeletonGrid } from "@components/shared/product/product-skeleton";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getAllProducts } from "../../../lib/actions/product.actions";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import {
  usePromotionByTagQuery,
  useProductsByTagQuery,
} from "../../../queries/promotions";

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
];

export default function TagPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const tag = params.tag as string;
  const sort = searchParams.get("sort") || "best-selling";
  const page = Number(searchParams.get("page")) || 1;

  const isSpecialTag = SPECIAL_TAGS.includes(tag);

  // Fetch products - different query for special tags vs promotions
  const {
    data: specialTagProducts,
    isLoading: isSpecialLoading,
    error: specialError,
  } = useQuery({
    queryKey: ["tag-products", tag, page, sort],
    queryFn: () => getAllProducts({ tag, page, sort }),
    enabled: isSpecialTag,
  });

  const {
    data: promotionData,
    isLoading: isPromotionLoading,
    error: promotionError,
  } = usePromotionByTagQuery(tag, {
    enabled: !isSpecialTag,
  });

  const {
    data: promotionProducts,
    isLoading: isPromotionProductsLoading,
    error: promotionProductsError,
  } = useProductsByTagQuery(tag, page, sort, {
    enabled: !isSpecialTag,
  });

  // Determine which data to use
  const productsToDisplay = isSpecialTag
    ? specialTagProducts?.products || []
    : promotionProducts?.products || [];

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

  if (isLoading) {
    return (
      <main>
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
    return <div className="text-center py-10">Promotion not found.</div>;
  }

  if (productsToDisplay.length === 0) {
    return (
      <main>
        {!isSpecialTag && promotionData && (
          <div
            className="w-full aspect-[16/6] md:aspect-[16/4] relative overflow-hidden"
            style={{
              backgroundColor: promotionData.background_color || "#ffffff",
            }}
          >
            <Image
              src={promotionData.image_url || "/images/placeholder-banner.jpg"}
              alt={promotionData.title || "Promotion banner"}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <Container className="py-8 text-center">
          <p>
            No products found in this {isSpecialTag ? "category" : "promotion"}.
          </p>
        </Container>
      </main>
    );
  }

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

  return (
    <main>
      {!isSpecialTag && promotionData && (
        <div
          className="w-full aspect-[16/6] md:aspect-[16/4] relative overflow-hidden mb-4"
          style={{
            backgroundColor: promotionData.background_color || "#ffffff",
          }}
        >
          <Image
            src={promotionData.image_url || "/images/placeholder-banner.jpg"}
            alt={promotionData.title || "Promotion banner"}
            fill
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
            {productsToDisplay.map((product) => (
              <ProductdetailsCard
                key={product.id || (product as any)._id}
                product={product}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={String(page)} totalPages={totalPages} />
          )}
        </div>
      </Container>
    </main>
  );
}
