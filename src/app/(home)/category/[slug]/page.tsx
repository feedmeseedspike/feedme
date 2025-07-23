import Link from "next/link";
import { Metadata } from "next";
import { Suspense } from "react";

import Pagination from "@components/shared/pagination";
import {
  getProductsServer,
  getAllTags,
} from "../../../../lib/actions/product.actions";
import ProductSortSelector from "@components/shared/product/product-sort-selector";
import {
  getFilterUrl,
  toSlug,
  mapSupabaseProductToIProductInput,
} from "../../../../lib/utils";

import Container from "@components/shared/Container";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
// import Headertags from "@components/shared/header/Headertags";
import { ProductSkeletonGrid } from "@components/shared/product/product-skeleton";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import ErrorBoundary from "@components/shared/ErrorBoundary";
import { getAllCategories } from "src/lib/api";
import { Tables } from "../../../../utils/database.types"; // Corrected import path
import Head from "next/head";

type Product = Tables<"products">;

const sortOrders = [
  { value: "price-low-to-high", name: "Price: Low to high" },
  { value: "price-high-to-low", name: "Price: High to low" },
  { value: "newest-arrivals", name: "Newest arrivals" },
  { value: "avg-customer-review", name: "Avg. customer review" },
  { value: "best-selling", name: "Best selling" },
];

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const categorySlug = params.slug;
  const categoryName = categorySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const categoryImage = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/category-images/${categorySlug}.jpg`
    : "/opengraph-image.jpg";

  return {
    title: `${categoryName}`,
    description: `Browse our selection of ${categoryName.toLowerCase()} products in Lagos, Nigeria. Find the best deals on ${categoryName} at FeedMe. Fast delivery in Lagos, Ikeja, Lekki, Victoria Island, and more!`,
    keywords: [
      `${categoryName}`,
      "food",
      "grocery",
      "online shopping",
      "delivery",
      `${categoryName} Lagos`,
      `${categoryName} delivery Lagos`,
      `${categoryName} Ikeja`,
      `${categoryName} Lekki`,
      `${categoryName} Victoria Island`,
    ],
    openGraph: {
      title: `${categoryName}`,
      description: `Discover our ${categoryName.toLowerCase()} collection. Shop now for the best prices and fast delivery in Lagos and beyond.`,
      type: "website",
      url: `/category/${categorySlug}`,
      images: [categoryImage || "/opengraph-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryName} | FeedMe`,
      description: `Explore our ${categoryName.toLowerCase()} selection in Lagos. Quality products at great prices, delivered fast in Lagos, Ikeja, Lekki, Victoria Island, and more.`,
      images: [categoryImage || "/opengraph-image.jpg"],
    },
  };
}

async function CategoryContent({
  categoryId,
  categoryName,
  sort,
  page,
  allCategories, 
}: {
  categoryId: string;
  categoryName: string;
  sort: string;
  page: string;
  allCategories: any[];
}) {
  const data = await getProductsServer({
    category: categoryId,
    page: Number(page),
    sort,
    limit: 20,
  });

  const noResults = data.totalProducts === 0;

  return (
    <div className="space-y-4">
      <div className="font-medium text-lg bg-white rounded-md p-3 w-full">
        {`Showing ${data.from}-${data.to} of ${data.totalProducts} results`}
      </div>
      {data.products.length === 0 ? (
        <div className="text-2xl md:text-3xl font-semibold flex justify-center items-center pt-36">
          No product found
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          {data.products.map((product: Product) => (
            <ProductdetailsCard
              key={product.id}
              product={mapSupabaseProductToIProductInput(
                product,
                allCategories
              )}
            />
          ))}
        </div>
      )}
      {data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} />
      )}
    </div>
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: {
    tag?: string;
    price?: string;
    rating?: string;
    sort?: string;
    page?: string;
  };
}) {
  const categorySlug = params.slug;
  const { sort = "best-selling", page = "1" } = searchParams;

  const allCategories = await getAllCategories();
  const categoryObj = allCategories.find(
    (c) => toSlug(c.title).toLowerCase() === categorySlug.toLowerCase()
  );

  if (!categoryObj) {
    return (
      <main>
        <div className="bg-white py-4">
          <Container>
            <CustomBreadcrumb hideCategorySegment={true} />
          </Container>
        </div>
        <Container className="py-8">
          <div className="text-2xl md:text-3xl font-semibold text-center">
            Category not found
          </div>
        </Container>
      </main>
    );
  }

  const categoryId = categoryObj.id;
  const categoryName = categoryObj.title;

  const filterParams = {
    category: categoryName,
    sort,
    page,
    q: "all",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://shopfeedme.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryObj.title,
        item: `https://shopfeedme.com/category/${categorySlug}`,
      },
    ],
  };
  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </Head>
      <main>
        <div className="md:border-b shadow-sm">
          <div className="bg-white py-4">
            <Container>
              <CustomBreadcrumb hideCategorySegment={true} />
            </Container>
          </div>
          <Container>
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-[#1B6013] text-2xl md:text-3xl !leading-5 font-bold">
                  {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                </h1>
              </div>
              <div className="flex items-center">
                <div className="rounded-2xl px-4">
                  <ProductSortSelector
                    sortOrders={sortOrders}
                    sort={sort}
                    params={filterParams}
                  />
                </div>
              </div>
            </div>
          </Container>
        </div>

        <Container className="py-8">
          <ErrorBoundary>
            <Suspense fallback={<ProductSkeletonGrid count={12} />}>
              <CategoryContent
                categoryId={categoryId}
                categoryName={categoryName}
                sort={sort}
                page={page}
                allCategories={allCategories}
              />
            </Suspense>
          </ErrorBoundary>
        </Container>
      </main>
    </>
  );
}
