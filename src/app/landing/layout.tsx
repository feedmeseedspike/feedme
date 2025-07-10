/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "FeedMe - Fresh, Affordable Food Delivered in Lagos",
  description:
    "Shop fresh, affordable food with FeedMe. Fast delivery of grains, oils, meat, and vegetables anywhere in Lagos.",
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

        <main>{children}</main>

  );
}
