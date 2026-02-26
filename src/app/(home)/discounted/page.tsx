export const dynamic = "force-dynamic";

import Container from "@components/shared/Container";
import Pagination from "@components/shared/pagination";
import ProductSortSelector from "@components/shared/product/product-sort-selector";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import { createServerComponentClient } from "src/utils/supabase/server";
import { getAllCategoriesQuery } from "src/queries/categories";
import { mapSupabaseProductToIProductInput, CategoryData } from "src/lib/utils";
import { IProductInput } from "src/types";
import { Tag, Percent } from "lucide-react";

const DISCOUNT_TAGS = [
  "discount:5%",
  "discount:10%",
  "discount:15%",
  "discount:20%",
  "discount:25%",
  "discount:30%",
  "discount:40%",
  "discount:50%",
  "discount:5",
  "discount:10",
  "discount:15",
  "discount:20",
  "discount:25",
  "discount:30",
  "discount:40",
  "discount:50",
  "Discount:5%",
  "Discount:10%",
  "Discount:15%",
  "Discount:20%",
  "Discount:25%",
  "Discount:30%",
  "Discount:40%",
  "Discount:50%",
  "Discount: 10 % discount",
  "Discount: 5 % discount",
  "Discount: 20 % discount",
];

const LIMIT = 20;

const sortOrders = [
  { value: "price-low-to-high", name: "Price: Low to High" },
  { value: "price-high-to-low", name: "Price: High to Low" },
  { value: "newest-arrivals", name: "Newest Arrivals" },
  { value: "best-selling", name: "Best Selling" },
];

export default async function DiscountedPage({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) {
  const sort = searchParams.sort || "best-selling";
  const page = Number(searchParams.page) || 1;
  const from = (page - 1) * LIMIT;
  const to = from + LIMIT - 1;

  const supabase = await createServerComponentClient();

  // Build the discount filter using the same tag overlap logic
  const tagsLiteral = `{${DISCOUNT_TAGS.map((t) => `"${t}"`).join(",")}}`;

  // Fetch categories for mapping
  const { data: allCategoriesData } = await getAllCategoriesQuery(supabase);
  const allCategories = (allCategoriesData as CategoryData[]) || [];

  // Build paginated + sorted query
  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .filter("tags", "ov", tagsLiteral);

  // Apply sorting
  switch (sort) {
    case "price-low-to-high":
      query = query.order("price", { ascending: true });
      break;
    case "price-high-to-low":
      query = query.order("price", { ascending: false });
      break;
    case "newest-arrivals":
      query = query.order("created_at", { ascending: false });
      break;
    case "best-selling":
    default:
      query = query.order("num_sales", { ascending: false });
      break;
  }

  query = query.order("id", { ascending: true }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching discounted products:", error);
  }

  const products: IProductInput[] =
    (data || []).map((product: any) =>
      mapSupabaseProductToIProductInput(product, allCategories)
    );

  const totalProducts = count || 0;
  const totalPages = Math.ceil(totalProducts / LIMIT);

  return (
    <main className="min-h-screen bg-white">
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
                Massive Discount Deals
              </h1>
            </div>
            <div className="flex items-center">
              <ProductSortSelector
                sortOrders={sortOrders}
                sort={sort}
                params={{ sort, page: String(page) }}
              />
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              No Deals Right Now
            </h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Check back soon — our team updates discounts regularly.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductdetailsCard
                  key={product.id}
                  product={product}
                  tag="discounted"
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10">
                <Pagination totalPages={totalPages} page={page} />
              </div>
            )}
          </>
        )}
      </Container>
    </main>
  );
}
