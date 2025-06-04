import Banner from "@components/shared/home/Home-banner";
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
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { prefetchQuery } from "@supabase-cache-helpers/postgrest-react-query";

import useSupabaseServer from "src/utils/supabase/server";
import { cookies } from "next/headers";

import { getAllCategoriesQuery } from "src/queries/categories";
import {
  getProductsByTagQuery,
  // getFreshFruitsQuery,
  // getFreshVegetablesQuery,
  // getTrendingProductsQuery,
} from "src/queries/products";

export default async function Home() {
  const queryClient = new QueryClient();
  const cookieStore = cookies();
  const supabase = useSupabaseServer(cookieStore);

  await Promise.all([
    // Keep getUser for now if not using Supabase Auth hooks
    // getUser(),
    prefetchQuery(queryClient, getAllCategoriesQuery(supabase)),
    prefetchQuery(queryClient, getProductsByTagQuery(supabase, "todays-deal")),
    prefetchQuery(queryClient, getProductsByTagQuery(supabase, "best-seller")),
    prefetchQuery(queryClient, getProductsByTagQuery(supabase, "new-arrival")),
    prefetchQuery(queryClient, getProductsByTagQuery(supabase, "featured")),
    prefetchQuery(queryClient, getProductsByTagQuery(supabase, "recommended")),
    // prefetchQuery(queryClient, getProductsByTagQuery(supabase, "fresh-fruits")),
    // prefetchQuery(queryClient, getProductsByTagQuery(supabase, "trending")),
    // prefetchQuery(
    //   queryClient,
    //   getProductsByTagQuery(supabase, "fresh-vegetables")
    // ),
    // prefetchQuery(queryClient, getTrendingProductsQuery(supabase, 10)),
    // prefetchQuery(queryClient, getFreshFruitsQuery(supabase, 10)),
    // prefetchQuery(queryClient, getFreshVegetablesQuery(supabase, 10)),
  ]);

  // Fetch user separately if not using TanStack Query for it
  const user = await getUser();

  return (
    // Wrap your content with HydrationBoundary
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="">
        <Headertags />
        <div className="bg-[#F9FAFB]">
          <Container>
            <Banner />

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

              <Promo />

              <Suspense fallback={<ProductSliderSkeleton />}>
                <ProductSlider
                  title={"Trending Near You"}
                  href="/trending"
                  tag="trending"
                  limit={10}
                />
              </Suspense>

              {/* Fresh Fruits - Assuming ProductSlider uses useQuery now */}
              <Suspense fallback={<ProductSliderSkeleton />}>
                <ProductSlider
                  title={"Fresh Fruits"}
                  href="/fresh-fruits"
                  tag="fresh-fruits" 
                  limit={10}
                />
              </Suspense>

              {/* Fresh Vegetables - Assuming ProductSlider uses useQuery now */}
              <Suspense fallback={<ProductSliderSkeleton />}>
                <ProductSlider
                  title={"Fresh Vegetables"}
                  href="/fresh-vegetables"
                  tag="fresh-vegetables" 
                />
              </Suspense>

              {/* <Suspense fallback={<ProductSliderSkeleton />}>
                <BrowsingHistoryList className="mt-10" />
              </Suspense> */}
            </div>
          </Container>
        </div>
      </main>
    </HydrationBoundary>
  );
}
