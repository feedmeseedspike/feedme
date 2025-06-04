import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "../app/global.css";
import { ReduxProvider } from "@providers/redux-providers";
import { LocationProvider } from "@components/shared/header/Location";
import CustomScrollbar from "@components/shared/CustomScrollbar";
import NextTopLoader from "nextjs-toploader";
import { ToastProvider } from "src/hooks/useToast";
import CartMergeProvider from "@providers/CartMergeProvider";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { SupabaseAuthProvider } from "@components/supabase-auth-provider";
import { ReactQueryClientProvider } from "@providers/ReactQueryClientProvider";
import WhatsAppButton from "@components/WhatsAppButton";

const proxima = localFont({
  src: [
    {
      path: "../../public/fonts/proxima-nova/ProximaNova-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/proxima-nova/ProximaNova-Semibold.otf",
      weight: "600",
      style: "semibold",
    },
  ],
  variable: "--font-proxima",
});
const inter = Inter({ subsets: ["latin"] });

// Lazy load non-critical components
const TawkToWidget = dynamic(() => import("@components/shared/TawkToWidget"), {
  ssr: false,
  loading: () => null,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://feedme.seedspikeafrica.com/"),
  title: {
    template: "%s - FeedMe",
    default: "FeedMe - Real Food, Real Fast, Delivered in 3 Hours",
  },
  keywords:
    "fresh produce, farm-fresh delivery, organic food, grocery online shopping, healthy eating",
  description:
    "Shop fresh, authentic farm produce delivered to your doorstep in 3 hours or less! Explore high-quality fruits, vegetables, oils, peppers, tubers, sauces, and spices. FeedMe ensures unbeatable freshness and convenience for a superior farm-to-table experience. Start shopping now!",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://feedme.seedspikeafrica.com/",
    title: "FeedMe - Fresh Farm Produce Delivered in 3 Hours",
    description:
      "Shop fresh, authentic farm produce delivered to your doorstep in 3 hours or less! Explore high-quality fruits, vegetables, oils, peppers, tubers, sauces, and spices. FeedMe ensures unbeatable freshness and convenience for a superior farm-to-table experience. Start shopping now!",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "FeedMe - Fresh Farm Produce Delivered in 3 Hours",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@https://x.com/Seedspike15427",
    title: "FeedMe - Fresh Farm Produce Delivered in 3 Hours",
    description:
      "Shop fresh, authentic farm produce delivered to your doorstep in 3 hours or less! Explore high-quality fruits, vegetables, oils, peppers, tubers, sauces, and spices. FeedMe ensures unbeatable freshness and convenience for a superior farm-to-table experience.",
    images: ["/opengraph-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={proxima.variable}>
      <body className="font-custom">
        <NextTopLoader showSpinner={false} color="#F0800F" shadow="0" />
        <LocationProvider>
          <ReactQueryClientProvider>
            <ReduxProvider>
              <ToastProvider>
                <CartMergeProvider>
                  <SupabaseAuthProvider>
                    <CustomScrollbar>{children}</CustomScrollbar>
                  </SupabaseAuthProvider>
                </CartMergeProvider>
              </ToastProvider>
              {/* <Suspense fallback={null}>
                <TawkToWidget />
              </Suspense> */}
            </ReduxProvider>
          </ReactQueryClientProvider>
        </LocationProvider>
        <WhatsAppButton
          phoneNumber="+2348144602273"
          message="Hello! I have a question about your products."
        />
      </body>
    </html>
  );
}
