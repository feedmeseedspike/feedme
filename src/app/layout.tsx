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
import { SupabaseAuthProvider } from "../components/supabase-auth-provider";
import { ReactQueryClientProvider } from "@providers/ReactQueryClientProvider";
import { createClient as createServerSupabaseClient } from "@utils/supabase/server";
import { User, Session } from "@supabase/supabase-js";
import { PathnameProvider } from "@components/shared/pathname-provider";
import { getReferralStatus } from "@/queries/referrals";
import { cookies } from "next/headers";

const DynamicReferralBanner = dynamic(
  () => import("@components/shared/ReferralBanner"),
  {
    ssr: false,
    loading: () => null,
  }
);

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

export const metadata: Metadata = {
  metadataBase: new URL("https://shopfeedme.com/"),
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
    url: "https://shopfeedme.com/",
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
  const supabase = createServerSupabaseClient();

  const { data: userData, error: authError } = await supabase.auth.getUser();

  const authenticatedUser: User | null = userData.user ?? null;
  console.log("SSR user:", authenticatedUser);

  let user = null;
  let session = null;
  let hasReferralStatus = false;

  if (authenticatedUser) {
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", authenticatedUser.id)
      .single();

    if (userProfile) {
      user = userProfile;
    } else {
      // Fallback: use the auth user if no profile row
      user = {
        user_id: authenticatedUser.id,
        display_name:
          typeof authenticatedUser.user_metadata?.display_name === "string"
            ? authenticatedUser.user_metadata.display_name
            : typeof authenticatedUser.email === "string"
              ? authenticatedUser.email
              : null,
        avatar_url:
          typeof authenticatedUser.user_metadata?.avatar_url === "string"
            ? authenticatedUser.user_metadata.avatar_url
            : null,
        birthday: null,
        created_at:
          typeof authenticatedUser.created_at === "string"
            ? authenticatedUser.created_at
            : null,
        favorite_fruit: null,
        role: null,
        status: null,
      };
    }

    // Fetch referral status
    const { data: referralData, message: referralMessage } =
      await getReferralStatus();
    if (referralData) {
      hasReferralStatus = true;
    }
  }

  // Only log unexpected errors, not missing session
  if (authError && authError.name !== "AuthSessionMissingError") {
    console.error(
      "RootLayout: Unexpected auth error fetching user/session on server:",
      authError
    );
    console.log(
      "RootLayout: Auth error details:",
      authError.message,
      authError.stack
    );
    session = null;
    user = null;
  }

  return (
    <html lang="en" className={proxima.variable}>
      <body className="font-custom">
        <NextTopLoader showSpinner={false} color="#F0800F" shadow="0" />
        <LocationProvider>
          <ReactQueryClientProvider>
            <ReduxProvider>
              <ToastProvider>
                <CartMergeProvider>
                  <SupabaseAuthProvider
                    initialSession={session}
                    initialUser={user}
                  >
                    <CustomScrollbar>
                      <PathnameProvider hasReferralStatus={hasReferralStatus}>
                        {children}
                      </PathnameProvider>
                    </CustomScrollbar>
                  </SupabaseAuthProvider>
                </CartMergeProvider>
              </ToastProvider>
              {/* <Suspense fallback={null}>
                <TawkToWidget />
              </Suspense> */}
            </ReduxProvider>
          </ReactQueryClientProvider>
        </LocationProvider>
      </body>
    </html>
  );
}
