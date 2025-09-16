import BreadCrumb from "@components/shared/breadcrumb";
import Container from "@components/shared/Container";
import { getProductBySlug } from "../../../../lib/actions/product.actions";
import { getAllCategoriesQuery } from "src/queries/categories";
import { createClient } from "src/utils/supabase/server";
import { Tables } from "@/utils/database.types";

type Category = Tables<"categories">;

export default async function HomeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  const supabase = await createClient();
  const { data: categoriesData } = await getAllCategoriesQuery(supabase);

  // Find the category name from categoriesData using the first category_id
  let categoryName = "Category";
  let productName = product?.name || "";
  const categoryIds = product?.category_ids;
  if (
    Array.isArray(categoryIds) &&
    categoryIds?.[0] != null &&
    categoriesData
  ) {
    const found = categoriesData.find(
      (cat: any) => String(cat.id) === String(categoryIds[0])
    );
    categoryName = found?.title || categoryIds[0];
  }

  return (
    <div className="flex flex-col ">
      {/* <Header /> */}
      <div className="bg-white">
        <Container className="py-4">
          <BreadCrumb category={categoryName} productName={productName} />
        </Container>
      </div>

      <main className="">{children}</main>
      {/* <Footer /> */}
    </div>
  );
}
