import { Metadata } from "next";
import CheckoutForm from "./checkout-form";
// import { auth } from '@/auth'
import { redirect } from "next/navigation";
import { getUser } from "src/lib/actions/auth.actions";
import Container from "@components/shared/Container";
import CustomBreadcrumb from "@components/shared/breadcrumb";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const data = await getUser();
  // const data = session?.data;
  // console.log(session);

  if (!data) {
    redirect("/login?callbackUrl=/checkout");
  }
  return (
    <>
      <div className="bg-white py-4">
        <Container className="">
          <CustomBreadcrumb />
        </Container>
      </div>
      <CheckoutForm user={data} />
    </>
  );
}
