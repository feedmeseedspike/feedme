// app/[tag]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Pagination from "@components/shared/pagination";
import { getAllProducts } from "../../../lib/actions/product.actions";
import ProductSortSelector from "@components/shared/product/product-sort-selector";
import Container from "@components/shared/Container";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
import Headertags from "@components/shared/header/Headertags";
import { ProductSkeletonGrid } from "@components/shared/product/product-skeleton";
import Image from "next/image";
import { Suspense } from "react";

const promoBanners: Record<
  string,
  {
    title: string;
    subtitle?: string;
    imageUrl: string;
    bgColor?: string;
  }
> = {
  "black-friday": {
    title: "Black Friday Mega Sale!",
    subtitle: "Up to 70% OFF - Limited Time",
    imageUrl: "/images/fruits.png",
    bgColor: "#000000",
  },
  "todays-deal": {
    title: "Today's Hot Deals",
    subtitle: "Fresh discounts updated daily",
    imageUrl: "/images/riverbite.png",
    bgColor: "#1B6013",
  },
  "fresh-fruits": {
    title: "100% Fresh Fruits",
    subtitle: "Summer Special: 64% OFF",
    imageUrl: "/images/fruits-banner.jpg",
    bgColor: "#F0800F",
  },
};

const sortOrders = [
  { value: "price-low-to-high", name: "Price: Low to high" },
  { value: "price-high-to-low", name: "Price: High to low" },
  { value: "newest-arrivals", name: "Newest arrivals" },
  { value: "best-selling", name: "Best selling" },
];

const pageTitles: Record<string, string> = {
  "new-arrival": "New Arrivals",
  "todays-deal": "Today's Deals",
  "black-friday": "Black Friday",
  featured: "Featured Products",
  "best-seller": "Best Selling Products",
  recommended: "Recommended For You",
  trending: "Trending Products",
};

export async function generateMetadata({
  params,
}: {
  params: { tag: string };
}): Promise<Metadata> {
  const title = pageTitles[params.tag] || "Not Found";
  return {
    title: `${title}`,
    description: `Browse our selection of ${title.toLowerCase()} at FeedMe.`,
  };
}

export default async function TagProductsPage({
  params,
  searchParams,
}: {
  params: { tag: string };
  searchParams: { sort?: string; page?: string };
}) {
  const { sort = "best-selling", page = "1" } = searchParams;
  const data = await getAllProducts({
    tag: params.tag,
    query: "all",
    page: Number(page),
    sort,
  });

  if (!data || data.totalProducts === 0) return notFound();

  const pageTitle =
    pageTitles[params.tag] ||
    params.tag
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const promoBanner = promoBanners[params.tag];
  return (
    <main>
      <Headertags />

      {promoBanner && (
        <div
          className="w-full aspect-[16/6] md:aspect-[16/4] relative overflow-hidden"
          style={{ backgroundColor: promoBanner.bgColor }}
        >
          <div className="absolute inset-0">
            <Image
              src={promoBanner.imageUrl}
              alt={promoBanner.title}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}

      <div className="py-2 px-4 md:border-b shadow-sm">
        <Container>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-[#1B6013] text-2xl md:text-3xl font-bold">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center">
              <ProductSortSelector
                sortOrders={sortOrders}
                sort={sort}
                params={{ tag: params.tag, sort, page }}
              />
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="space-y-4">
          <Suspense fallback={<ProductSkeletonGrid count={12} />}>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
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
