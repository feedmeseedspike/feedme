import Link from "next/link";
import Pagination from "@components/shared/pagination";
import ProductCard from "@components/shared/product/product-card";
import { Button } from "@components/ui/button";
import {
  // getAllCategories,
  getAllTags,
  getRelatedProductsByCategory,
} from "../../../lib/actions/product.actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import ProductSortSelector from "@components/shared/product/product-sort-selector";
import { getFilterUrl, toSlug } from "../../../lib/utils";
import Rating from "@components/shared/product/rating";

import CollapsibleOnMobile from "@components/shared/collapsible-on-mobile";
import Container from "@components/shared/Container";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
import Headertags from "@components/shared/header/Headertags";
import { Suspense } from "react";
import { ProductSkeletonGrid } from "@components/shared/product/product-skeleton";
import PriceRangeSlider from "@components/shared/product/price-range-slider";
import ProductSlider from "@components/shared/product/product-slider";
import { getAllCategories } from "src/lib/api";
import { createClient } from "@utils/supabase/client";
import { getAllProducts } from "../../../queries/products";
import { IProductInput } from "src/types";

const sortOrders = [
  { value: "price-low-to-high", name: "Price: Low to high" },
  { value: "price-high-to-low", name: "Price: High to low" },
  { value: "newest-arrivals", name: "Newest arrivals" },
  { value: "avg-customer-review", name: "Avg. customer review" },
  { value: "best-selling", name: "Best selling" },
];

export async function generateMetadata(props: {
  searchParams: Promise<{
    q: string;
    category: string;
    tag: string;
    price: string;
    rating: string;
    sort: string;
    page: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const {
    q = "all",
    category = "all",
    tag = "all",
    price = "all",
    rating = "all",
  } = searchParams;

  if (
    (q !== "all" && q !== "") ||
    category !== "all" ||
    tag !== "all" ||
    rating !== "all" ||
    price !== "all"
  ) {
    return {
      title: `${q !== "all" ? q : ""}${
        category !== "all" ? ` : Category ${category}` : ""
      }${tag !== "all" ? ` : Tag ${tag}` : ""}${
        price !== "all" ? ` : Price ${price}` : ""
      }${rating !== "all" ? ` : Rating ${rating}` : ""}`,
    };
  } else {
    return {
      title: "Search Products",
    };
  }
}

const SearchPage = async (props: {
  searchParams: Promise<{
    q: string;
    category: string;
    tag: string;
    price: string;
    rating: string;
    sort: string;
    page: string;
  }>;
}) => {
  const searchParams = await props.searchParams;

  const {
    q = "all",
    category = "all",
    tag = "all",
    price = "all",
    rating = "all",
    sort = "best-selling",
    page = "1",
  } = searchParams;

  const params = { q, category, tag, price, rating, sort, page };

  const categories = await getAllCategories();
  const tags = await getAllTags();
  const client = createClient();
  const data = await getAllProducts(client, {
    category,
    tag,
    query: q,
    price,
    rating,
    page: Number(page),
    sort,
  });

  // Safely get a category for related products
  let relatedCategory: string | null = category !== "all" ? category : null;
  let productIdForExclusion = null;

  // If no category in params, try to get from first product
  if (!relatedCategory && data.products.length > 0) {
    const firstProduct = data.products[0];
    if (
      Array.isArray(firstProduct.category_ids) &&
      firstProduct.category_ids.length > 0
    ) {
      relatedCategory = firstProduct.category_ids[0];
      productIdForExclusion = firstProduct.id;
    }
  }

  // Fallback to first available category if still no category
  if (!relatedCategory && categories.length > 0) {
    relatedCategory = categories[0];
  }

  // Only fetch related products if we have a valid category
  let relatedProducts: { data: any[]; totalPages?: number } = { data: [] };
  if (relatedCategory) {
    relatedProducts = await getRelatedProductsByCategory({
      category: relatedCategory!,
      productId: productIdForExclusion || "",
      page: 1,
    });
  }

  const noResults = data.totalProducts === 0;

  // Get categories that actually have products in the search results
  const relevantCategories =
    q !== "all" && q !== ""
      ? Array.from(
          new Set(
            data.products
              .filter(
                (p) =>
                  Array.isArray(p.category_ids) &&
                  (p.category_ids?.length ?? 0) > 0
              )
              .map((p) => p.category_ids![0])
          )
        )
      : categories;

  // Add a mapping function for Supabase product row to IProductInput
  function mapSupabaseProductToIProductInput(product: any): IProductInput {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category_ids ?? [],
      images: product.images ?? [],
      tags: product.tags ?? [],
      is_published: !!product.is_published,
      price: product.price ?? 0,
      list_price: product.list_price ?? 0,
      stockStatus: product.stock_status ?? "",
      brand: product.brand ?? "",
      vendor: product.vendor ?? undefined,
      avg_rating: product.avg_rating ?? 0,
      num_reviews: product.num_reviews ?? 0,
      ratingDistribution: product.rating_distribution ?? [],
      numSales: product.num_sales ?? 0,
      countInStock: product.count_in_stock ?? 0,
      description: product.description ?? "",
      colors: product.colors ?? [],
      options: product.options ?? [],
      reviews: product.reviews ?? [],
    };
  }

  return (
    <main>
      <Headertags />
      {!noResults && (
        <div className="py-2 md:border-b shadow-sm">
          <Container className="lg:!px-[40px]">
            <div className="flex justify-between items-center ">
              <div className="flex items-center">
                {category !== "all" ? (
                  <h1 className="relative z-10 py-1 md:py-3 text-[#1B6013] text-2xl md:text-3xl font-bold">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h1>
                ) : (
                  <>
                    <span className="">{`${data.from}-${data.to} of ${data.totalProducts} results`}</span>
                    {(q !== "all" && q !== "") ||
                    tag !== "all" ||
                    rating !== "all" ||
                    price !== "all" ? (
                      <Button variant={"link"} asChild>
                        <Link href="/search">Clear</Link>
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
              <div className="flex items-center">
                <div className="rounded-2xl px-4">
                  <ProductSortSelector
                    sortOrders={sortOrders}
                    sort={sort}
                    params={params}
                  />
                </div>
                {!noResults && (
                  <CollapsibleOnMobile title="Filters">
                    <div className="">
                      {/* Category */}
                      <Accordion type="single" collapsible>
                        <AccordionItem value="categories">
                          <AccordionTrigger>Categories</AccordionTrigger>
                          <AccordionContent>
                            <ul className="flex gap-3 flex-wrap ">
                              <li className="border-[2px] p-2 rounded-md border-gray-600">
                                <Link
                                  className={`${
                                    ("all" === category || "" === category) &&
                                    "text-primary"
                                  }`}
                                  href={getFilterUrl({
                                    category: "all",
                                    params,
                                  })}
                                >
                                  All
                                </Link>
                              </li>
                              {relevantCategories.map((c) => (
                                <li
                                  key={c}
                                  className="border p-2 rounded-md border-gray-300"
                                >
                                  <Link
                                    className={`${
                                      c === category && "text-green-600"
                                    }`}
                                    href={getFilterUrl({ category: c, params })}
                                  >
                                    {c}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      {/* Price */}
                      <Accordion type="single" collapsible>
                        <AccordionItem value="price">
                          <AccordionTrigger>Price</AccordionTrigger>
                          <AccordionContent>
                            <PriceRangeSlider
                              params={params}
                              maxPrice={Math.max(
                                ...data.products.map((p) =>
                                  typeof p.price === "number" ? p.price : 0
                                ),
                                0
                              )}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      {/* Customer Review */}
                      <Accordion type="single" collapsible>
                        <AccordionItem value="customer-review">
                          <AccordionTrigger>Customer Review</AccordionTrigger>
                          <AccordionContent>
                            <ul className="flex flex-col gap-2">
                              <li className="border px-2 py-1 rounded-md border-gray-400">
                                <Link
                                  href={getFilterUrl({ rating: "all", params })}
                                  className={`${
                                    !rating || rating === "all"
                                      ? "text-primary"
                                      : ""
                                  }`}
                                >
                                  All Ratings
                                </Link>
                              </li>
                              {[5, 4, 3, 2, 1].map((ratingValue) => (
                                <li
                                  key={ratingValue}
                                  className="border px-2 py-1 rounded-md border-gray-400"
                                >
                                  <Link
                                    href={getFilterUrl({
                                      rating: ratingValue.toString(),
                                      params: {
                                        ...params,
                                        rating: ratingValue.toString(),
                                      },
                                    })}
                                    className={`${
                                      rating === ratingValue.toString()
                                        ? "text-primary"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Rating size={4} rating={ratingValue} />
                                      <span>& Up</span>
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </CollapsibleOnMobile>
                )}
              </div>
            </div>
          </Container>
        </div>
      )}

      <Container className="lg:!px-[40px] grid md:grid-cols-8 md:gap-4 py-4">
        <aside className="hidden md:block space-y-4 bg-white h-fit p-4 py-8 rounded-md col-span-2 lg:sticky lg:top-10">
          {relevantCategories.length > 0 && (
            <div>
              <div className="font-bold flex gap-1 items-center w-full">
                Category{" "}
                <div className="flex items-center w-full">
                  <span className="bg-[#1B6013] flex items-center h-1 w-10 rounded-md"></span>
                  <span className="w-full border-b" />
                </div>
              </div>
              <ul className="text-[14p] pl-2 pt-2 flex flex-col gap-2">
                {/* <li>
                    <Link
                      className={`${"all" === category && "text-[#1B6013]"}`}
                      href={getFilterUrl({ category: "all", params })}
                    >
                      All
                    </Link>
                  </li> */}
                {relevantCategories.map((c) => (
                  <li key={c}>
                    <Link
                      className={`${
                        c === category && "text-[#1B6013]"
                      } grid gap-2`}
                      href={`/category/${c}`}
                    >
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <div className="font-bold flex gap-1 items-center w-full">
              Price{" "}
              <div className="flex items-center w-full">
                <span className="bg-[#1B6013] flex items-center h-1 w-10 rounded-md"></span>
                <span className="w-full border-b" />
              </div>
            </div>
            <div className="pl-2 pt-2">
              <PriceRangeSlider
                params={params}
                maxPrice={Math.max(
                  ...data.products.map((p) =>
                    typeof p.price === "number" ? p.price : 0
                  ),
                  0
                )}
              />
            </div>
          </div>
          <div>
            <div className="font-bold flex gap-1 items-center w-full whitespace-nowrap">
              Customer Review{" "}
              <div className="flex items-center w-full">
                <span className="bg-[#1B6013] flex items-center h-1 w-10 rounded-md"></span>
                <span className="w-full border-b" />
              </div>
            </div>
            <ul className="pl-2 pt-2 space-y-2">
              <li>
                <Link
                  href={getFilterUrl({ rating: "all", params })}
                  className={`${
                    !rating || rating === "all" ? "text-[#1B6013]" : ""
                  }`}
                >
                  All Ratings
                </Link>
              </li>
              {[5, 4, 3, 2, 1].map((ratingValue) => (
                <li key={ratingValue}>
                  <Link
                    href={getFilterUrl({
                      rating: ratingValue.toString(),
                      params: { ...params, rating: ratingValue.toString() },
                    })}
                    className={`${
                      rating === ratingValue.toString() ? "text-[#1B6013]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Rating size={4} rating={ratingValue} />
                      <span>& Up</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="md:col-span-6 space-y-4">
          {category !== "all" ? (
            <div className="font-medium text-lg bg-white rounded-md p-3 w-full">{`Showing ${data.from}-${data.to} of ${data.totalProducts} results`}</div>
          ) : (
            <div>
              <div className="font-bold text-xl">Results</div>
              <div>Check each product page for other buying options</div>
            </div>
          )}
          <Suspense fallback={<ProductSkeletonGrid count={12} />}>
            <div className="flex flex-col justify-center items-center mx-auto text-center">
              {data.products.length === 0 && (
                <div className="max-w-xl  pt-[5rem]">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4"></div>
                  <h3 className="text-lg md:text-5xl font-extrabold w-full  mb-4">
                    Oops! We couldn&apos;t find what you&apos;re looking for
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Try checking the spelling or searching with different
                    keywords.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="border-[#1B6013] bg-[#1B6013] text-white px-10 py-6 hover:bg-[#1B6013]/90 rounded-full"
                  >
                    <Link href="/search">Clear all filters</Link>
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 ">
              {data.products.map((product) => (
                <ProductdetailsCard
                  key={product.id}
                  product={mapSupabaseProductToIProductInput(product)}
                />
              ))}
            </div>
          </Suspense>
          {data.totalPages > 1 && (
            <Pagination page={page} totalPages={data.totalPages} />
          )}
        </div>
        {relatedProducts.data.length > 0 && (
          <section className="mt-10">
            <ProductSlider
              products={relatedProducts.data}
              title={"You may also like"}
            />
          </section>
        )}
      </Container>
    </main>
  );
};

export default SearchPage;
