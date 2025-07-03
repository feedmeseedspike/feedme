export const dynamic = "force-dynamic";
import { Metadata } from "next";
import CheckoutForm from "./checkout-form";
// import { auth } from '@/auth'
import { redirect } from "next/navigation";
import { getUser } from "src/lib/actions/auth.actions";
import Container from "@components/shared/Container";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import { getUserAddresses } from "src/queries/addresses";
import { getWalletBalanceServer } from "src/lib/actions/wallet.actions";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const user = await getUser();
  // const data = session?.data;
  // console.log(session);

  if (!user) {
    redirect("/login?callbackUrl=/checkout");
  }

  // Fetch addresses and wallet balance server-side
  const addresses = user?.user_id ? await getUserAddresses(user.user_id) : [];
  const walletBalance = user?.user_id
    ? await getWalletBalanceServer(user.user_id)
    : 0;

  return (
    <>
      <div className="bg-white py-4">
        <Container className="">
          <CustomBreadcrumb />
        </Container>
      </div>
      <CheckoutForm addresses={addresses || []} walletBalance={walletBalance} />
    </>
  );
}
