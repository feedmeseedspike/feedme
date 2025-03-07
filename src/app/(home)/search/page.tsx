import Link from "next/link";

import Pagination from "@components/shared/pagination";
import ProductCard from "@components/shared/product/product-card";
import { Button } from "@components/ui/button";
import {
  getAllCategories,
  getAllProducts,
  getAllTags,
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
import { Separator } from "@components/ui/separator";

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
  // console.log(searchParams)
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
      title: `Search ${q !== "all" ? q : ""}${
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

  const categories = getAllCategories();
  const tags = getAllTags();
  const data = getAllProducts({
    category,
    tag,
    query: q,
    price,
    rating,
    page: Number(page),
    sort,
  });

  const noResults = data.totalProducts === 0;
  // console.log(data)
  return (
    <main>
      <Headertags />
      {!noResults && (
        <div className="py-2 md:border-b shadow-sm">
              <Container>
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
                        href={getFilterUrl({ category: "all", params })}
                      >
                        All
                      </Link>
                    </li>
                    {categories.map((c) => (
                      <li
                        key={c}
                        className="border p-2 rounded-md border-gray-300"
                      >
                        <Link
                          className={`${c === category && "text-green-600"}`}
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
                  <ul className="flex gap-3 flex-wrap ">
                    <li className="border-[2px] px-2 py-1 rounded-md border-gray-600">
                      <Link
                        className={`${"all" === price && "text-primary"}`}
                        href={getFilterUrl({ price: "all", params })}
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
                          href={getFilterUrl({ price: p.value, params })}
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
                        href={getFilterUrl({ rating: "all", params })}
                        className={`${"all" === rating && "text-primary"}`}
                      >
                        All
                      </Link>
                    </li>
                    <li className="border px-2 py-1 rounded-md border-gray-400">
                      <Link
                        href={getFilterUrl({ rating: "4", params })}
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
                        href={getFilterUrl({ tag: "all", params })}
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
                          href={getFilterUrl({ tag: t, params })}
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
      )}
            </div>
          </div>
                </Container>
        </div>
      )}


      <Container className="grid md:grid-cols-8 md:gap-4 py-4">
        {!noResults && (
          <div className="hidden md:block space-y-4 bg-white h-fit p-4 rounded-md col-span-2">
            <div>
              <div className="font-bold flex gap-1 items-center w-full">
                Categories{" "}
                <div className="flex items-center w-full">
                  <span className="bg-[#1B6013] flex items-center h-1 w-10 rounded-md"></span>
                  <span className="w-full border-b" />
                </div>
              </div>
              <ul className="text-[14p]">
                <li>
                  <Link
                    className={`${
                      ("all" === category || "" === category) && "text-primary"
                    }`}
                    href={getFilterUrl({ category: "all", params })}
                  >
                    All
                  </Link>
                </li>
                {categories.map((c) => (
                  <li key={c}>
                    <Link
                      className={`${c === category && "text-primary"}`}
                      href={getFilterUrl({ category: c, params })}
                    >
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-bold flex gap-1 items-center w-full">
                Price{" "}
                <div className="flex items-center w-full">
                  <span className="bg-[#1B6013] flex items-center h-1 w-10 rounded-md"></span>
                  <span className="w-full border-b" />
                </div>
              </div>
              <ul>
                <li>
                  <Link
                    className={`${"all" === price && "text-primary"}`}
                    href={getFilterUrl({ price: "all", params })}
                  >
                    All
                  </Link>
                </li>
                {prices.map((p) => (
                  <li key={p.value}>
                    <Link
                      href={getFilterUrl({ price: p.value, params })}
                      className={`${p.value === price && "text-primary"}`}
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
              <ul>
                <li>
                  <Link
                    href={getFilterUrl({ rating: "all", params })}
                    className={`${"all" === rating && "text-primary"}`}
                  >
                    All
                  </Link>
                </li>
                <li>
                  <Link
                    href={getFilterUrl({ rating: "4", params })}
                    className={`${"4" === rating && "text-primary"}`}
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
              <ul className="flex gap-x-2 gap-y-5 flex-wrap pt-4">
                <li>
                  <Link
                    className={`${
                      ("all" === tag || "" === tag) &&
                      "border-zinc-700 text-green-600"
                    }  border px-2 py-2 rounded-sm border-zinc-500`}
                    href={getFilterUrl({ tag: "all", params })}
                  >
                    All
                  </Link>
                </li>
                {tags.map((t) => (
                  <li key={t}>
                    <Link
                      className={`${
                        toSlug(t) === tag && "text-primary"
                      } border px-2 py-2 rounded-sm border-zinc-500`}
                      href={getFilterUrl({ tag: t, params })}
                    >
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="md:col-span-6 space-y-4">
          {category !== "all" ? (
            <div className="font-medium text-lg bg-white rounded-md p-3 w-full">{`Showing ${data.from}-${data.to} of ${data.totalProducts} results`}</div>
          ) : (
            <div>
              <div className="font-bold text-xl">Results</div>
              <div>Check each product page for other buying options</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-">
            {data.products.length === 0 && (
              <div className="text-2xl font-semibold">No product found</div>
            )}
            {data.products.map((product) => (
              <ProductdetailsCard key={product._id} product={product} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <Pagination page={page} totalPages={data.totalPages} />
          )}
        </div>
      </Container>
    </main>
  );
};

export default SearchPage;
