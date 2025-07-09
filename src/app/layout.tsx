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
import { SupabaseAuthProvider } from "../components/supabase-auth-provider";
import { ReactQueryClientProvider } from "@providers/ReactQueryClientProvider";
import { createServerComponentClient } from "@utils/supabase/server";
import { User } from "@supabase/supabase-js";
import { PathnameProvider } from "@components/shared/pathname-provider";
import { getReferralStatus } from "@/queries/referrals";

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
  let authenticatedUser: User | null = null;
  let user = null;
  let session = null;
  let hasReferralStatus = false;

  try {
    const supabase = await createServerComponentClient();

    if (supabase) {
      const { data: userData, error: authError } =
        await supabase.auth.getUser();
      // console.log(userData);

      // Only process if we have valid user data and no critical errors
      if (
        userData?.user &&
        (!authError || authError.name === "AuthSessionMissingError")
      ) {
        authenticatedUser = userData.user;
        // console.log("SSR user:", authenticatedUser);

        try {
          // Try to fetch user profile
          const { data: userProfile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", authenticatedUser.id)
            .single();

          if (userProfile && !profileError) {
            user = userProfile;
          } else {
            // Fallback: create user object from auth user
            user = {
              user_id: authenticatedUser.id,
              display_name:
                typeof authenticatedUser.user_metadata?.display_name ===
                "string"
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
              email: authenticatedUser.email || null,
            };
          }

          // Try to fetch referral status
          try {
            const { data: referralData, message: referralMessage } =
              await getReferralStatus();
            if (referralData) {
              hasReferralStatus = true;
            }
          } catch (referralError) {
            console.warn("Could not fetch referral status:", referralError);
            // Continue without referral status
          }
        } catch (profileError) {
          console.warn("Error fetching user profile:", profileError);
          // Continue with auth user only
        }
      } else if (authError && authError.name !== "AuthSessionMissingError") {
        console.error("RootLayout: Auth error:", authError.message);
      }
    } else {
      console.warn("Failed to create Supabase client in layout");
    }
  } catch (error) {
    console.error("Error in RootLayout:", error);
    // Continue with null user/session
  }

  // JSON-LD for Organization
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FeedMe",
    url: "https://shopfeedme.com/",
    logo: "https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png",
    sameAs: [
      "https://www.facebook.com/shopfeedme",
      "https://www.instagram.com/shopfeedme",
      "https://x.com/Seedspike15427",
    ],
  };

  return (
    <html lang="en" className={proxima.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
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
            </ReduxProvider>
          </ReactQueryClientProvider>
        </LocationProvider>
      </body>
    </html>
  );
}
