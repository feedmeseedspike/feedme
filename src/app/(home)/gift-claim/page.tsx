import React, { Suspense } from "react";
import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "src/utils/supabase/server";
import GiftClaimClient from "./gift-claim-client";

interface Props {
  searchParams: { o?: string };
}

export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const orderId = searchParams.o;
  if (!orderId) return { title: "Claim Your Gift | FeedMe" };

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("shipping_address")
    .eq("id", orderId)
    .single();

  const senderName = (order?.shipping_address as any)?.senderName || "A friend";
  
  return {
    title: `${senderName} sent you a meal! | FeedMe`,
    description: `You've received a fresh meal from ${senderName}. Complete your delivery details to claim it!`,
    openGraph: {
      title: `${senderName} bought you lunch!`,
      description: "Claim your fresh meal from FeedMe. Just enter your address and we'll handle the rest.",
      images: ["https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"],
    },
  };
}

export default function GiftClaimPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading gift...</div>}>
      <GiftClaimClient orderId={searchParams.o} />
    </Suspense>
  );
}
