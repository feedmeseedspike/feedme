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
import { CategoryResponse } from "src/types/category";
import ProductSlider from "@components/shared/product/product-slider";
import Container from "@components/shared/Container";
import Headertags from "@components/shared/header/Headertags";
import Promo from "@components/shared/home/promo";
import { getUser } from "src/lib/actions/auth.actions";
import BrowsingHistoryList from "@components/shared/browsing-history-list";

const fetchCategories = async (): Promise<CategoryResponse> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/category/get-categories`,
    {
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
};

export default async function Home() {
  const user = await getUser();
  const categoriesResponse = await fetchCategories();

  // Fetch products for each section
  const todaysDeals = getProductsByTag({ tag: "todays-deal" });
  const bestSellingProducts = getProductsByTag({ tag: "best-seller" });
  const newArrivals = getProductsByTag({ tag: "new-arrival" });
  const featureds = getProductsByTag({ tag: "featured" });
  const recommendedProducts = getProductsByTag({ tag: "recommended" });
  
  // Use our new functions for these sections
  const trendingProducts = getTrendingProducts({ limit: 10 });
  const freshFruits = getFreshFruits({ limit: 10 });
  const freshVegetables = getFreshVegetables({ limit: 10 });

  return (
    <main className="">
      <Headertags />
      <div className="bg-[#F9FAFB]">
        <Container>
          <Banner />
          <TopCategories categories={categoriesResponse.data} />
          <div className="flex flex-col gap-12">
            {/* New Arrivals */}
            <ProductSlider
              title={"New Arrivals"}
              products={newArrivals}
              href="/new-arrival"
            />

            {/* Today's Deals */}
            <ProductSlider
              title={"Today's Deals"}
              products={todaysDeals}
              href="/todays-deal"
            />

            {/* Best Sellers */}
            <ProductSlider
              title={"Best Selling Products 🔥"}
              products={bestSellingProducts}
              href="/best-seller"
            />

            {/* Featured Products */}
            {/* <ProductSlider
              title={"Featured Products"}
              products={featureds}
              href="/featured"
            /> */}

            <Promo />
            
            {/* Trending Products */}
            <ProductSlider
              title={"Trending Near You"}
              products={trendingProducts}
              href="/trending"
            />

            {/* Fresh Fruits */}
            <ProductSlider
              title={"Fresh Fruits"}
              products={freshFruits}
              href="/fresh-fruits"
            />
            
            {/* Fresh Vegetables */}
            <ProductSlider
              title={"Fresh Vegetables"}
              products={freshVegetables}
              href="/fresh-vegetables"
            />
            
            <section>
              <BrowsingHistoryList className="mt-10" />
            </section>
          </div>
        </Container>
      </div>
    </main>
  );
}
