export const dynamic = "force-dynamic";
import { Metadata } from "next";
import CheckoutForm from "./checkout-form";
// import { auth } from '@/auth'
import { redirect } from "next/navigation";
import { getUser } from "src/lib/actions/auth.actions";
import Container from "@components/shared/Container";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import { getAddressesForCurrentUser } from "@/app/(dashboard)/account/addresses/actions";
import { getWalletBalanceServer } from "src/lib/actions/wallet.actions";
import { createClient } from "@/utils/supabase/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const user = await getUser();
  // const data = session?.data;
  // console.log(session);

  // if (!user) {
  //   redirect("/login?callbackUrl=/checkout");
  // }

  // Fetch addresses and wallet balance server-side
  const addresses = user ? await getAddressesForCurrentUser() : [];
  const walletBalance = user?.user_id
    ? await getWalletBalanceServer(user.user_id)
    : 0;

  // Fetch delivery locations server-side
  const supabase = await createClient();
  const { data: locations, error: locationsError } = await supabase
    .from("delivery_locations")
    .select("*");

  const deliveryLocations = locations || [];

  return (
    <>
      <div className="bg-white py-4">
        <Container className="">
          <CustomBreadcrumb />
        </Container>
      </div>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading checkout...</div>}>
        <CheckoutForm
          addresses={addresses || []}
          walletBalance={walletBalance}
          user={user}
          deliveryLocations={deliveryLocations}
        />
      </Suspense>
    </>
  );
}
