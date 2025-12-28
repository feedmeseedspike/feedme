import Banner from "@components/shared/home/Home-banner";
import Link from "next/link";
// import { HomeCarousel } from "@components/shared/home/Home-carousel";
import TopCategories from "@components/shared/home/TopCategories";
import ProductSlider from "@components/shared/product/product-slider";
import Container from "@components/shared/Container";
import Headertags from "@components/shared/header/Headertags";
import Promo from "@components/shared/home/promo";
import { getUser } from "src/lib/actions/auth.actions";
import { Skeleton } from "@components/ui/skeleton";
import { Suspense } from "react";
import ProductSliderSkeleton from "@components/shared/product/product-slider-skeleton";
import BundleSlider from "@components/shared/bundles/bundle-slider";
import FeaturedOffers from "@components/shared/home/FeaturedOffers";
import Riverbitee from "@components/shared/home/Riverbitee";
import CustomerReviews from "@components/shared/home/CustomerReviews";
import Partnerships from "@components/shared/home/Partnerships";
import TrustFooterHighlight from "@components/shared/home/TrustFooterHighlight";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { ReactQueryHydrate } from "@providers/ReactQueryHydrate";

import { createServerComponentClient } from "src/utils/supabase/server";

import { getAllCategoriesQuery } from "src/queries/categories";
import {
  getProductsByTagQuery,
  getUsersPurchasedProductIds,
} from "src/queries/products";
import { fetchBundles } from "src/queries/bundles";
import { mapSupabaseProductToIProductInput, CategoryData } from "src/lib/utils";
import { IProductInput } from "src/types";
import { Tables } from "src/utils/database.types";

type Category = Tables<"categories">;

// Next.js route segment config
export const dynamic = "force-dynamic";

export default async function Home() {
  const queryClient = new QueryClient();
  const supabase = await createServerComponentClient();

  const prefetchJobs = [
    queryClient.prefetchQuery({
      queryKey: ["categories"],
      queryFn: async () => {
        const { data, error } =
          await getAllCategoriesQuery(supabase).select("*");
        if (error) throw error;
        return data.map((category: Category) => {
          let thumbnailData: { url: string; public_id?: string } | null = null;
          if (category.thumbnail) {
            if (
              typeof category.thumbnail === "object" &&
              category.thumbnail !== null &&
              "url" in category.thumbnail &&
              typeof (category.thumbnail as any).url === "string"
            ) {
              thumbnailData = {
                url: (category.thumbnail as any).url,
                public_id: (category.thumbnail as any).public_id,
              };
            } else if (typeof category.thumbnail === "string") {
              thumbnailData = { url: category.thumbnail };
            }
          }
          return {
            ...category,
            thumbnail: thumbnailData,
          };
        });
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["products", { tag: "todays-deal", limit: 10 }],
      queryFn: async () => {
        const { data, error } = await getProductsByTagQuery(
          supabase,
          "todays-deal",
          10
        ).select("*");
        if (error) throw error;
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["products", { tag: "best-seller", limit: 10 }],
      queryFn: async () => {
        const { data, error } = await getProductsByTagQuery(
          supabase,
          "best-seller",
          10
        ).select("*");
        if (error) throw error;
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["products", { tag: "new-arrival", limit: 10 }],
      queryFn: async () => {
        const { data, error } = await getProductsByTagQuery(
          supabase,
          "new-arrival",
          10
        ).select("*");
        if (error) throw error;
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["products", { tag: "featured", limit: 10 }],
      queryFn: async () => {
        const { data, error } = await getProductsByTagQuery(
          supabase,
          "featured",
          10
        ).select("*");
        if (error) throw error;
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["products", { tag: "recommended", limit: 10 }],
      queryFn: async () => {
        const { data, error } = await getProductsByTagQuery(
          supabase,
          "recommended",
          10
        ).select("*");
        if (error) throw error;
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["products", { tag: "trending", limit: 10 }],
      queryFn: async () => {
        const { data, error } = await getProductsByTagQuery(
          supabase,
          "trending",
          10
        ).select("*");
        if (error) throw error;
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["products", { tag: "fresh-fruits", limit: 10 }],
      queryFn: async () => {
        const { data, error } = await getProductsByTagQuery(
          supabase,
          "fresh-fruits",
          10
        ).select("*");
        if (error) throw error;
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["products", { tag: "fresh-vegetables", limit: 10 }],
      queryFn: async () => {
        const { data, error } = await getProductsByTagQuery(
          supabase,
          "fresh-vegetables",
          10
        ).select("*");
        if (error) throw error;
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["sideBanners"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .eq("type", "side")
          .order("order", { ascending: true });
        if (error) throw error;
        return data || [];
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["carouselBanners"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("banners")
          .select("*, bundles(*)")
          .eq("type", "carousel")
          .eq("active", true)
          .order("order", { ascending: true });
        if (error) throw error;
        return data || [];
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["promotions", undefined],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("promotions")
          .select("*")
          .eq("is_active", true);
        if (error) throw error;
        return data || [];
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["bundles", { limit: 10 }],
      queryFn: () =>
        fetchBundles({
          itemsPerPage: 10,
          publishedStatus: ["published"],
        }),
    }),
  ];

  const prefetchResults = await Promise.allSettled(prefetchJobs);
  prefetchResults.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Prefetch error:", result.reason);
    }
  });

  let { data: rawCategories, error: allCategoriesError } =
    await getAllCategoriesQuery(supabase).select("*");

  let allCategories: CategoryData[] | null = null;
  if (rawCategories) {
    allCategories = rawCategories.map((category: Category) => {
      let thumbnailData: { url: string; public_id?: string } | null = null;
      if (category.thumbnail) {
        if (
          typeof category.thumbnail === "object" &&
          category.thumbnail !== null &&
          "url" in category.thumbnail &&
          typeof (category.thumbnail as any).url === "string"
        ) {
          thumbnailData = {
            url: (category.thumbnail as any).url,
            public_id: (category.thumbnail as any).public_id,
          };
        } else if (typeof category.thumbnail === "string") {
          thumbnailData = { url: category.thumbnail };
        }
      }
      return {
        ...category,
        thumbnail: thumbnailData,
      };
    });
  }

  if (allCategoriesError) {
    console.error(
      "Server - Error fetching allCategories directly:",
      allCategoriesError
    );
  }

  const { data: bestSellerProducts, error: bestSellerProductsError } =
    await getProductsByTagQuery(supabase, "best-seller");
  if (bestSellerProductsError) {
    console.error(
      "Server - Error fetching bestSellerProducts directly:",
      bestSellerProductsError
    );
  }

  const user = await getUser();

  let purchasedProductIds: string[] = [];
  if (user?.user_id) {
    purchasedProductIds = await getUsersPurchasedProductIds(
      supabase,
      user.user_id
    );
  }

  let recommendedProducts: IProductInput[] = [];
  if (bestSellerProducts && allCategories) {
    const filteredAndMappedProducts = bestSellerProducts
      .filter((product: any) => !purchasedProductIds.includes(product.id || ""))
      .map((product: any) =>
        mapSupabaseProductToIProductInput(product, allCategories)
      );
    recommendedProducts = filteredAndMappedProducts.slice(0, 10);
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <ReactQueryHydrate state={dehydratedState}>
      <main className="">
        <div className="bg-[#F9FAFB]">
          <Container>
            <Banner />

            {/* SPIN TO WIN - TEMPORARILY DISABLED */}
            {/* <Link href="/spin-to-win" className="block w-full mt-6 mb-2">
              <div className="rounded-xl overflow-hidden relative h-20 md:h-24 bg-gradient-to-r from-[#1B6013] to-[#F0800F] flex items-center justify-between px-6 md:px-12 shadow-lg group hover:shadow-xl transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-3xl md:text-4xl animate-bounce">🎡</span>
                  <div>
                    <h3 className="text-white font-bold text-lg md:text-2xl">Daily Spin & Win</h3>
                    <p className="text-white/90 text-xs md:text-sm">Win up to ₦1,000 Wallet Cash & Free Items!</p>
                  </div>
                </div>
                <div className="bg-white text-[#1B6013] px-4 py-2 rounded-lg font-bold text-sm group-hover:scale-105 transition-transform">
                    Play Now
                </div>
              </div>
            </Link> */}

            <Suspense
              fallback={
                <div className="mb-8">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-md" />
                    ))}
                  </div>
                </div>
              }
            >
              <TopCategories />
            </Suspense>

            <div className="flex flex-col gap-6">
              <Suspense fallback={<ProductSliderSkeleton />}>
                <ProductSlider
                  title={"New Arrivals"}
                  href="/new-arrival"
                  tag="new-arrival"
                  limit={10}
                />
              </Suspense>

              <Suspense fallback={<ProductSliderSkeleton />}>
                <BundleSlider title="Bundles " href="/bundles" limit={10} />
              </Suspense>

              <FeaturedOffers />

              <Promo />

              <CustomerReviews />

              {/* Riverbitee with Product Sliders Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Riverbitee - Left Column */}
                <div className="lg:col-span-1 order-2 lg:order-1">
                  <Riverbitee />
                </div>

                {/* Product Sliders - Right Columns */}
                <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                  <Suspense fallback={<ProductSliderSkeleton />}>
                    <ProductSlider
                      title={"Today's Deals"}
                      href="/todays-deal"
                      tag="todays-deal"
                      limit={10}
                    />
                  </Suspense>

                  <Suspense fallback={<ProductSliderSkeleton />}>
                    <ProductSlider
                      title={"Best Selling Products 🔥"}
                      href="/best-seller"
                      tag="best-seller"
                      limit={10}
                    />
                  </Suspense>
                </div>
              </div>

              <Suspense fallback={<ProductSliderSkeleton />}>
                <ProductSlider
                  title={"Trending Near You"}
                  href="/trending"
                  tag="trending"
                  limit={10}
                />
              </Suspense>

              <Partnerships />

              <Suspense fallback={<ProductSliderSkeleton />}>
                <ProductSlider
                  title={"Fresh Fruits"}
                  href="/fresh-fruits"
                  tag="fresh-fruits"
                  limit={10}
                />
              </Suspense>

              <Suspense fallback={<ProductSliderSkeleton />}>
                <ProductSlider
                  title={"Fresh Vegetables"}
                  href="/fresh-vegetables"
                  tag="fresh-vegetables"
                  limit={10}
                />
              </Suspense>
            </div>
          </Container>
          <TrustFooterHighlight />
        </div>
      </main>
    </ReactQueryHydrate>
  );
}
