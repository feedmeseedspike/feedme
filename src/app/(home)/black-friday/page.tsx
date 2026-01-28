import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import Container from "@components/shared/Container";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import ProductDetailsCard from "@components/shared/product/productDetails-card";
import ProductSortSelector from "@components/shared/product/product-sort-selector";
import { ProductSkeletonGrid } from "@components/shared/product/product-skeleton";
import ErrorBoundary from "@components/shared/ErrorBoundary";
import BrowsingHistoryList from "@components/shared/browsing-history-list";
import { createClient } from "@utils/supabase/server";
import { toSlug } from "@/lib/utils";
import { getFilterUrl } from "@/lib/utils";
import { Tables } from "@/utils/database.types";
import Head from "next/head";
import { notFound } from "next/navigation";

// Reuse sort orders from category page
const sortOrders = [
  { value: "price-low-to-high", name: "Price: Low to high" },
  { value: "price-high-to-low", name: "Price: High to low" },
  { value: "newest-arrivals", name: "Newest arrivals" },
  { value: "avg-customer-review", name: "Avg. customer review" },
  { value: "best-selling", name: "Best selling" },
];

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Black Friday Deals",
    description: "Explore all Black Friday deals on FeedMe. Premium products at unbeatable prices, fast delivery across Lagos.",
    keywords: ["Black Friday", "deals", "sale", "discount", "food", "grocery"],
    openGraph: {
      title: "Black Friday Deals | FeedMe",
      description: "Shop the best Black Friday discounts on food and groceries.",
      type: "website",
      url: "/black-friday",
      images: ["/opengraph-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: "Black Friday Deals | FeedMe",
      description: "Shop the best Black Friday discounts on food and groceries.",
      images: ["/opengraph-image.jpg"],
    },
  };
}

async function BlackFridayContent({ sort }: { sort: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("black_friday_items")
    .select(`*, products(*)`)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  // Debug: log raw data count
  console.log("Black Friday raw items count:", data?.length);

  // Keep items that have a product; ignore start/end dates for now
  const items = data?.filter((item) => !!item.products) ?? [];

  // console.log("Black Friday filtered items count:", items.length);

  if (items.length === 0) {
    return (
      <section className="bg-[#F5F7EF] py-16">
        <div className="container mx-auto px-4 text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#052E16]">Black Friday Sold Out</h1>
          <p className="text-[#4F5B3A]">All Black Friday lots are currently sold out. Join the WhatsApp group to be first in line when we restock.</p>
          <Link href="/" className="inline-block bg-[#1B6013] hover:bg-[#184f10] text-white px-6 py-3 rounded-md">Join WhatsApp Community</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="font-medium text-lg bg-white rounded-md p-3 w-full">
        {`Showing ${items.length} Black Friday deals`}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => {
          let productData = item.products;
          
          if (Array.isArray(productData)) {
            productData = productData[0];
          }

          const product = productData as Tables<"products">;

          if (!product || !product.id) return null;

          const productWithDeal = {
            ...product,
            price: item.new_price,
            options: null,
          };
          return (
            <ProductDetailsCard
              key={item.id}
              product={productWithDeal as any}
            />
          );
        })}
      </div>
    </div>
  );
}

export default async function BlackFridayPage({ searchParams }: { searchParams: { sort?: string } }) {
  const sort = searchParams?.sort || "best-selling";

  const filterParams = { sort };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://shopfeedme.com/" },
      { "@type": "ListItem", position: 2, name: "Black Friday", item: `https://shopfeedme.com/black-friday` },
    ],
  };

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
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
              <h1 className="text-[#1B6013] text-2xl md:text-3xl !leading-5 font-bold">Black Friday</h1>
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
              <BlackFridayContent sort={sort} />
            </Suspense>
          </ErrorBoundary>
        </Container>
        {/* <div className="mt-12 container mx-auto px-4">
          <BrowsingHistoryList />
        </div> */}
      </main>
    </>
  );
}
