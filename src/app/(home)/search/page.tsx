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
  { value: "best-selling", name: "Best selling" },
  { value: "newest-arrivals", name: "Newest arrivals" },
  { value: "avg-customer-review", name: "Avg. customer review" },
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
    season: string;
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
      title: `${q !== "all" ? q : ""}${category !== "all" ? ` : Category ${category}` : ""
        }${tag !== "all" ? ` : Tag ${tag}` : ""}${price !== "all" ? ` : Price ${price}` : ""
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
    season: string;
  }>;
}) => {
  const searchParams = await props.searchParams;

  const {
    q = "all",
    category = "all",
    tag = "all",
    price = "all",
    rating = "all",
    sort = "price-low-to-high",
    page = "1",
    season = "all",
  } = searchParams;

  const params = { q, category, tag, price, rating, sort, page, season };

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
    season,
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
    relatedCategory = categories[0]?.title || "";
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
      ).map(categoryId => {
        const foundCategory = categories.find(cat => cat.id === categoryId);
        return foundCategory || { id: categoryId, title: categoryId };
      }).filter(cat => cat.title !== cat.id) // Filter out categories where title is the same as ID (UUID)
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
      in_season: product.in_season ?? null,
    };
  }

  return (
    <main>
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
                      price !== "all" ||
                      season !== "all" ? (
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
                                  className={`${("all" === category || "" === category) &&
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
                                  key={typeof c === "string" ? c : c.id}
                                  className="border p-2 rounded-md border-gray-300"
                                >
                                  <Link
                                    className={`${(typeof c === "string" ? c : c.id) === category && "text-green-600"
                                      }`}
                                    href={getFilterUrl({
                                      category:
                                        typeof c === "string" ? c : c.id,
                                      params,
                                    })}
                                  >
                                    {typeof c === "string" ? c : c.title}
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
                                ...data.products.flatMap((p) => {
                                  const prices = [typeof p.price === "number" ? p.price : 0];
                                  // Include option prices if they exist
                                  if (p.options && Array.isArray(p.options)) {
                                    p.options.forEach((option: any) => {
                                      if (option.price && typeof option.price === "number") {
                                        prices.push(option.price);
                                      }
                                    });
                                  }
                                  return prices;
                                }),
                                1000 // Minimum fallback value
                              )}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      {/* Season */}
                      <Accordion type="single" collapsible>
                        <AccordionItem value="season">
                          <AccordionTrigger>Season</AccordionTrigger>
                          <AccordionContent>
                            <ul className="flex flex-col gap-2">
                              <li className="border px-2 py-1 rounded-md border-gray-400">
                                <Link
                                  href={getFilterUrl({ season: "all", params })}
                                  className={`${!season || season === "all"
                                    ? "text-primary"
                                    : ""
                                    }`}
                                >
                                  All Seasons
                                </Link>
                              </li>
                              <li className="border px-2 py-1 rounded-md border-gray-400">
                                <Link
                                  href={getFilterUrl({ season: "true", params })}
                                  className={`${season === "true" ? "text-primary" : ""
                                    }`}
                                >
                                  In Season
                                </Link>
                              </li>
                              <li className="border px-2 py-1 rounded-md border-gray-400">
                                <Link
                                  href={getFilterUrl({ season: "false", params })}
                                  className={`${season === "false" ? "text-primary" : ""
                                    }`}
                                >
                                  Out of Season
                                </Link>

                              </li>
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
        <aside className="hidden md:block space-y-4 bg-white h-fit p-4 py-8 rounded-md col-span-2">
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
                  <li key={typeof c === "string" ? c : c.id}>
                    <Link
                      className={`${(typeof c === "string" ? c : c.id) === category && "text-[#1B6013]"
                        } grid gap-2`}
                      href={`/category/${typeof c === "string" ? toSlug(c) : toSlug(c.title)}`}
                    >
                      {typeof c === "string" ? c : c.title}
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
                  ...data.products.flatMap((p) => {
                    const prices = [typeof p.price === "number" ? p.price : 0];
                    // Include option prices if they exist
                    if (p.options && Array.isArray(p.options)) {
                      p.options.forEach((option: any) => {
                        if (option.price && typeof option.price === "number") {
                          prices.push(option.price);
                        }
                      });
                    }
                    return prices;
                  }),
                  1000 // Minimum fallback value
                )}
              />
            </div>
          </div>
          <div>
            <div className="font-bold flex gap-1 items-center w-full">
              Season{" "}
              <div className="flex items-center w-full">
                <span className="bg-[#1B6013] flex items-center h-1 w-10 rounded-md"></span>
                <span className="w-full border-b" />
              </div>
            </div>
            <ul className="pl-2 pt-2 space-y-2">
              <li>
                <Link
                  href={getFilterUrl({ season: "all", params })}
                  className={`${!season || season === "all" ? "text-[#1B6013]" : ""
                    }`}
                >
                  All Seasons
                </Link>
              </li>
              <li>
                <Link
                  href={getFilterUrl({ season: "true", params })}
                  className={`${season === "true" ? "text-[#1B6013]" : ""
                    }`}
                >
                  In Season
                </Link>
              </li>
              <li>
                <Link
                  href={getFilterUrl({ season: "false", params })}
                  className={`${season === "false" ? "text-[#1B6013]" : ""
                    }`}
                >
                  Out of Season
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        <div className="md:col-span-6 space-y-4">
          {q !== "all" && q !== "" ? (
            <div className="bg-white rounded-md p-4 w-full">
              <h1 className="font-bold text-xl mb-2">Search results for &quot;{q}&quot;</h1>
              <div className="text-gray-600">{`Showing ${data.from}-${data.to} of ${data.totalProducts} results`}</div>
            </div>
          ) : category !== "all" ? (
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
      </Container>

      {/* Related Products Section */}
      {relatedProducts.data.length > 0 && (
        <Container className="lg:!px-[40px] mt-8">
          <section>
            <ProductSlider
              products={relatedProducts.data}
              title={"You may also like"}
            />
          </section>
        </Container>
      )}
    </main>
  );
};

export default SearchPage;
