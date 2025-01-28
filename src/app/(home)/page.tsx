import Banner from "@components/home/Home-banner";
import { HomeCarousel } from "@components/home/Home-carousel";
import TopCategories from "@components/home/TopCategories";
import { CategoryResponse } from "src/types/category";

const fetchCategories = async (): Promise<CategoryResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category/get-categories`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

export default async function Home() {
  const categoriesResponse = await fetchCategories();

  return (
    <main className="">
      <Banner />
      <TopCategories categories={categoriesResponse.data} />
      {/* <HomeCarousel /> */}
    </main>
  );
}
