import Banner from "@components/shared/home/Home-banner";
import { HomeCarousel } from "@components/shared/home/Home-carousel";
import TopCategories from "@components/shared/home/TopCategories";
import {
  getAllCategories,
  getProductsByTag,
  getProductsForCard,
} from "src/lib/actions/product.actions";
import { CategoryResponse } from "src/types/category";
import { Card, CardContent } from "@components/ui/card";
import ProductSlider from "@components/shared/product/product-slider";
import Container from "@components/shared/Container";
import Headertags from "@components/shared/header/Headertags";
import Promo from "@components/shared/home/promo";
import { getUser } from "src/lib/actions/user.actions";

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
    // console.log(user)
  
  const todaysDeals = getProductsByTag({ tag: "todays-deal" });
  const bestSellingProducts = getProductsByTag({ tag: "best-seller" });

  const categories = getAllCategories().slice(0, 4);
  const newArrivals = getProductsForCard({
    tag: "new-arrival",
  });
  // console.log(newArrivals)
  const featureds = getProductsForCard({
    tag: "featured",
  });
  const bestSellers = getProductsForCard({
    tag: "best-seller",
  });
  const categoriesResponse = await fetchCategories();

  return (
    <main className="">
      <Headertags />
      <div className="bg-[#F9FAFB]">
        <Container>
          <Banner />
          <TopCategories categories={categoriesResponse.data} />
          <div className="flex flex-col gap-12">
            <ProductSlider
              title={"Best Selling Products 🔥"}
              products={bestSellingProducts}
              // hideDetails
            />
            <ProductSlider title={"New Stock"} products={todaysDeals} />
            <ProductSlider
              title={"Pick For You"}
              products={bestSellingProducts}
              // hideDetails
            />
            <ProductSlider
              title={"Trending Near You"}
              products={bestSellingProducts}
            />
            <Promo />
          </div>
        </Container>
      </div>
    </main>
  );
}
