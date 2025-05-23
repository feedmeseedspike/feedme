import Banner from "@components/shared/home/Home-banner";
import { HomeCarousel } from "@components/shared/home/Home-carousel";
import TopCategories from "@components/shared/home/TopCategories";
import {
  getAllCategories,
  getProductsByTag,
  getProductsForCard,
  getFreshFruits,
  getFreshVegetables,
  getTrendingProducts,
} from "src/lib/actions/product.actions";
import ProductSlider from "@components/shared/product/product-slider";
import Container from "@components/shared/Container";
import Headertags from "@components/shared/header/Headertags";
import Promo from "@components/shared/home/promo";
import { getUser } from "src/lib/actions/auth.actions";
import { Skeleton } from "@components/ui/skeleton";
import { Suspense } from "react";
import ProductSliderSkeleton from "@components/shared/product/product-slider-skeleton";

export default async function Home() {
  const [
    user,
    categories,
    todaysDeals,
    bestSellingProducts,
    newArrivals,
    featureds,
    recommendedProducts,
    trendingProducts,
    freshFruits,
    freshVegetables,
  ] = await Promise.all([
    getUser(),
    getAllCategories(),
    getProductsByTag({ tag: "todays-deal" }),
    getProductsByTag({ tag: "best-seller" }),
    getProductsByTag({ tag: "new-arrival" }),
    getProductsByTag({ tag: "featured" }),
    getProductsByTag({ tag: "recommended" }),
    getTrendingProducts({ limit: 10 }),
    getFreshFruits({ limit: 10 }),
    getFreshVegetables({ limit: 10 }),
  ]);

  return (
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
            <TopCategories categories={categories} />
          </Suspense>

          <div className="flex flex-col gap-12">
            {/* New Arrivals */}
            <Suspense fallback={<ProductSliderSkeleton />}>
              <ProductSlider
                title={"New Arrivals"}
                products={newArrivals}
                href="/new-arrival"
              />
            </Suspense>

            {/* Today's Deals */}
            <Suspense fallback={<ProductSliderSkeleton />}>
              <ProductSlider
                title={"Today's Deals"}
                products={todaysDeals}
                href="/todays-deal"
              />
            </Suspense>

            {/* Best Sellers */}
            <Suspense fallback={<ProductSliderSkeleton />}>
              <ProductSlider
                title={"Best Selling Products 🔥"}
                products={bestSellingProducts}
                href="/best-seller"
              />
            </Suspense>

            <Promo />

            {/* Trending Products */}
            <Suspense fallback={<ProductSliderSkeleton />}>
              <ProductSlider
                title={"Trending Near You"}
                products={trendingProducts}
                href="/trending"
              />
            </Suspense>

            {/* Fresh Fruits */}
            <Suspense fallback={<ProductSliderSkeleton />}>
              <ProductSlider
                title={"Fresh Fruits"}
                products={freshFruits}
                href="/fresh-fruits"
              />
            </Suspense>

            {/* Fresh Vegetables */}
            <Suspense fallback={<ProductSliderSkeleton />}>
              <ProductSlider
                title={"Fresh Vegetables"}
                products={freshVegetables}
                href="/fresh-vegetables"
              />
            </Suspense>

            {/* <Suspense fallback={<ProductSliderSkeleton />}>
              <BrowsingHistoryList className="mt-10" />
            </Suspense> */}
          </div>
        </Container>
      </div>
    </main>
  );
}
