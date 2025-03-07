import { Metadata } from "next";
import CheckoutForm from "./checkout-form";
// import { auth } from '@/auth'
import { redirect } from "next/navigation";
import { getUser } from "src/lib/actions/auth.actions";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const session = await getUser();
  const data = session?.data
  console.log(session);

  if (!data) {
    redirect("/login?callbackUrl=/checkout");
  }
  return <CheckoutForm user={data} />;
}
