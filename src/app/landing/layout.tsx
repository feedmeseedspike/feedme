import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed Me - Fresh Produce in Nigeria",
  description: "Feed Me - Fresh Produce Deals in Nigeria",
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main>{children}</main>;
}
