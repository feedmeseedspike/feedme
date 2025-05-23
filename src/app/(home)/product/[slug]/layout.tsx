import Header from "@components/shared/header"
import BreadCrumb from "@components/shared/breadcrumb";
import Container from "@components/shared/Container";
import { getProductBySlug } from "../../../../lib/actions/product.actions";

export default async function HomeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  const category = product?.category || "";

  return (
    <div className='flex flex-col '>
      {/* <Header /> */}
      <div className="bg-white">
        <Container className="py-4">
          <BreadCrumb category={category[0]} />
        </Container>
      </div>

      <main className=''>{children}</main>
      {/* <Footer /> */}
    </div>
  )
}
