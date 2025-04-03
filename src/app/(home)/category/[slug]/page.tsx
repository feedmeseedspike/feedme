import Link from "next/link";
import { Metadata } from "next";

import Pagination from "@components/shared/pagination";
import { Button } from "@components/ui/button";
import {
  getAllCategories,
  getAllProducts,
  getAllTags,
} from "../../../../lib/actions/product.actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import ProductSortSelector from "@components/shared/product/product-sort-selector";
import { getFilterUrl, toSlug } from "../../../../lib/utils";
import Rating from "@components/shared/product/rating";

import CollapsibleOnMobile from "@components/shared/collapsible-on-mobile";
import Container from "@components/shared/Container";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
import Headertags from "@components/shared/header/Headertags";
import { Separator } from "@components/ui/separator";
import { Suspense } from "react";
import { ProductSkeletonGrid } from "@components/shared/product/product-skeleton";

const sortOrders = [
  { value: "price-low-to-high", name: "Price: Low to high" },
  { value: "price-high-to-low", name: "Price: High to low" },
  { value: "newest-arrivals", name: "Newest arrivals" },
  { value: "avg-customer-review", name: "Avg. customer review" },
  { value: "best-selling", name: "Best selling" },
];

const prices = [
  {
    name: "Under 2000",
    value: "1-2000",
  },
  {
    name: "Under ₦50000",
    value: "2100-50000",
  },
  {
    name: "Under ₦100000",
    value: "51000-100000",
  },
];

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const categorySlug = params.slug;
  const categoryName = categorySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    title: `${categoryName}`,
    description: `Browse our selection of ${categoryName.toLowerCase()} products. Find the best deals on ${categoryName} at FeedMe.`,
    keywords: [`${categoryName}`, 'food', 'grocery', 'online shopping', 'delivery'],
    openGraph: {
      title: `${categoryName}`,
      description: `Discover our ${categoryName.toLowerCase()} collection. Shop now for the best prices and fast delivery.`,
      type: 'website',
      url: `/category/${categorySlug}`,
      images: [
        {
          url: `{/images/category-banner.jpg}`,	
          width: 1200,
          height: 630,
          alt: `${categoryName} products`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${categoryName} | FeedMe`,
      description: `Explore our ${categoryName.toLowerCase()} selection. Quality products at great prices.`,
    },
  };
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
  const categoryName = categorySlug.replace(/-/g, " ");
  
  const {
    tag = "all",
    price = "all",
    rating = "all",
    sort = "best-selling",
    page = "1",
  } = searchParams;

  const filterParams = { 
    category: categoryName, 
    tag, 
    price, 
    rating, 
    sort, 
    page,
    q: "all"
  };

  console.log(categoryName)

  const categories = getAllCategories();
  const tags = getAllTags();
  const data = getAllProducts({
    category: categoryName,
    tag,
    query: "all",
    price,
    rating,
    page: Number(page),
    sort,
  });

  const noResults = data.totalProducts === 0;

  return (
    <main>
      <Headertags />
      {!noResults && (
        <div className="py-2 md:border-b shadow-sm">
          <Container>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h1 className=" text-[#1B6013] text-2xl md:text-3xl font-bold">
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
                <CollapsibleOnMobile title="Filters">
                  <div className="">
                    {/* Price */}
                    <Accordion type="single" collapsible>
                      <AccordionItem value="price">
                        <AccordionTrigger>Price</AccordionTrigger>
                        <AccordionContent>
                          <ul className="flex gap-3 flex-wrap ">
                            <li className="border-[2px] px-2 py-1 rounded-md border-gray-600">
                              <Link
                                className={`${"all" === price && "text-primary"}`}
                                href={getFilterUrl({ price: "all", params: filterParams }) || ""}
                              >
                                All
                              </Link>
                            </li>
                            {prices.map((p) => (
                              <li
                                key={p.value}
                                className="border px-2 py-1 rounded-md border-gray-400"
                              >
                                <Link
                                  href={getFilterUrl({ price: p.value, params: filterParams }) || ""}
                                  className={`${p.value === price && "text-primary"}`}
                                >
                                  {p.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Customer Review */}
                    <Accordion type="single" collapsible>
                      <AccordionItem value="customer-review">
                        <AccordionTrigger>Customer Review</AccordionTrigger>
                        <AccordionContent>
                          <ul className="flex gap-3 flex-wrap ">
                            <li className="border px-2 py-1 rounded-md border-gray-400">
                              <Link
                                href={getFilterUrl({ rating: "all", params: filterParams }) || ""}
                                className={`${"all" === rating && "text-primary"}`}
                              >
                                All
                              </Link>
                            </li>
                            <li className="border px-2 py-1 rounded-md border-gray-400">
                              <Link
                                href={getFilterUrl({ rating: "4", params: filterParams }) || ""}
                                className={`${"4" === rating && "text-primary"}`}
                              >
                                <div className="flex">
                                  <Rating size={4} rating={4} /> & Up
                                </div>
                              </Link>
                            </li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Tag */}
                    <Accordion type="single" collapsible>
                      <AccordionItem value="tag">
                        <AccordionTrigger>Tag</AccordionTrigger>
                        <AccordionContent>
                          <ul className="flex gap-3 flex-wrap ">
                            <li className="border px-2 py-1 rounded-md border-gray-400">
                              <Link
                                className={`${
                                  ("all" === tag || "" === tag) && "text-primary"
                                }`}
                                href={getFilterUrl({ tag: "all", params: filterParams }) || ""}
                              >
                                All
                              </Link>
                            </li>
                            {tags.map((t) => (
                              <li
                                key={t}
                                className="border px-2 py-1 rounded-md border-gray-400"
                              >
                                <Link
                                  className={`${toSlug(t) === tag && "text-primary"}`}
                                  href={getFilterUrl({ tag: t, params: filterParams }) || ""}
                                >
                                  {t}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </CollapsibleOnMobile>
              </div>
            </div>
          </Container>
        </div>
      )}

      <Container className="grid md:grid-cols-8 md:gap-4 py-8">
          <aside className="hidden md:block space-y-4 bg-white h-fit p-4 py-8 rounded-md col-span-2 lg:sticky lg:top-10">
            <div>
              <div className="font-bold flex gap-1 items-center w-full">
                Price{" "}
                <div className="flex items-center w-full">
                  <span className="bg-[#1B6013] flex items-center h-1 w-10 rounded-md"></span>
                  <span className="w-full border-b" />
                </div>
              </div>
              <ul className="pl-2 space-y-2">
                <li>
                  <Link
                    className={`${"all" === price && "text-[#1B6013]"}`}
                    href={getFilterUrl({ price: "all", params: filterParams }) || ""}
                  >
                    All
                  </Link>
                </li>
                {prices.map((p) => (
                  <li key={p.value}>
                    <Link
                      href={getFilterUrl({ price: p.value, params: filterParams }) || ""}
                      className={`${p.value === price && "text-[#1B6013]"}`}
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-bold flex gap-1 items-center w-full whitespace-nowrap">
                Customer Review{" "}
                <div className="flex items-center w-full">
                  <span className="bg-[#1B6013] flex items-center h-1 w-10 rounded-md"></span>
                  <span className="w-full border-b" />
                </div>
              </div>
              <ul className="pl-2 space-y-2">
                <li>
                  <Link
                    href={getFilterUrl({ rating: "all", params: filterParams }) || ""}
                    className={`${"all" === rating && "text-[#1B6013]"}`}
                  >
                    All
                  </Link>
                </li>
                <li>
                  <Link
                    href={getFilterUrl({ rating: "4", params: filterParams }) || ""}
                    className={`${"4" === rating && "text-[#1B6013]"}`}
                  >
                    <div className="flex">
                      <Rating size={4} rating={4} /> & Up
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-bold flex gap-1 items-center w-full">
                Tags{" "}
                <div className="flex items-center w-full">
                  <span className="bg-[#1B6013] flex items-center h-1 w-10 rounded-md"></span>
                  <span className="w-full border-b" />
                </div>
              </div>
              <ul className="flex gap-x-2 gap-y-5 flex-wrap pt-4 pl-2">
                <li>
                  <Link
                    className={`${
                      ("all" === tag || "" === tag) &&
                      "border-zinc-700 text-[#1B6013]"
                    }  border px-2 py-2 rounded-sm border-zinc-500`}
                    href={getFilterUrl({ tag: "all", params: filterParams }) || ""}
                  >
                    All
                  </Link>
                </li>
                {tags.map((t) => (
                  <li key={t}>
                    <Link
                      className={`${
                        toSlug(t) === tag && "text-[#1B6013]"
                      } border px-2 py-2 rounded-sm border-zinc-500`}
                      href={getFilterUrl({ tag: t, params: filterParams }) || ""}
                    >
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

        <div className="md:col-span-6 space-y-4">
          <div className="font-medium text-lg bg-white rounded-md p-3 w-full">{`Showing ${data.from}-${data.to} of ${data.totalProducts} results`}</div>
          <Suspense fallback={<ProductSkeletonGrid count={12} />}>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-">
              {data.products.length === 0 && (
                <div className="text-2xl font-semibold">No product found</div>
              )}
              {data.products.map((product) => (
                <ProductdetailsCard key={product._id} product={product} />
              ))}
            </div>
          </Suspense>
          {data.totalPages > 1 && (
            <Pagination page={page} totalPages={data.totalPages} />
          )}
        </div>
      </Container>
    </main>
  );
}