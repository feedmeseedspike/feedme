/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import type { Metadata } from "next";
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
import Script from "next/script";
import RegisterSW from "../components/register-sw";
import RegisterPush from "@components/shared/RegisterPush";
import { NewVisitorProvider } from "@components/shared/ExitIntentProvider";
import SignupWelcomeProvider from "@components/shared/SignupWelcomeProvider";

const DynamicReferralBanner = dynamic(
  () => import("@components/shared/ReferralBanner"),
  {
    ssr: false,
    loading: () => null,
  }
);

const DealsPopup = dynamic(
  () => import("@components/shared/DealsPopup"),
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
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shopfeedme.com/"),
  manifest: "/manifest.json",
  themeColor: "#ff6600",
  appleWebApp: {
    capable: true,
    title: "FeedMe",
    statusBarStyle: "default",
  },
  title: {
    template: "%s - FeedMe",
    default: "FeedMe - Real Food, Real Fast, Delivered in 3 Hours",
  },
  keywords: [
    "fresh produce Lagos",
    "farm-fresh delivery Lagos",
    "organic food Lagos Nigeria",
    "grocery online shopping Lagos",
    "healthy eating Lagos",
    "buy fruits online Lagos",
    "vegetable delivery Victoria Island",
    "grocery delivery Ikeja",
    "farm-to-table Lekki",
    "order fresh fruits online in Lagos",
    "best grocery delivery service in Lagos",
    "affordable farm produce Lagos",
    "grocery delivery Yaba",
    "farm produce Surulere",
    "organic vegetables Ikoyi",
    "delivered in 3 hours Lagos",
    "cash on delivery Lagos",
  ],
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
        url: "/opengraph-image.jpg",
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
    images: ["/opengraph-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
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
            // Continue without referral status
          }
        } catch (profileError) {
          // Continue with auth user only
        }
      } else if (authError && authError.name !== "AuthSessionMissingError") {
        console.error("RootLayout: Auth error:", authError.message);
      }
    } else {
      // Continue with null user/session
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
        {/* Resource hints for performance */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link
          rel="dns-prefetch"
          href="https://fyldgskqxrfmrhyluxmw.supabase.co"
        />
        <link rel="dns-prefetch" href="https://*.supabase.co" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <head>
        {/* Google Analytics - Deferred to reduce blocking */}
        {/* Google Analytics - Load after interactive for reliable tracking */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-DT105JV69M"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DT105JV69M');
          `}
        </Script>
        {/* Google Tag Manager - Load after interactive for reliable tracking */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-W8L93RRF');
          `}
        </Script>

        {/* Meta Pixel - Deferred to reduce blocking */}
        <Script id="meta-pixel" strategy="lazyOnload">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '781786040868058');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>
      <body className="font-custom">
        <RegisterSW />
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W8L93RRF"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=781786040868058&ev=PageView&noscript=1"
          />
        </noscript>
        <NextTopLoader showSpinner={false} color="#F0800F" shadow="0" />
        {user?.user_id && <RegisterPush userId={user.user_id} />}
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
                        <SignupWelcomeProvider>
                          <DealsPopup />
                          <NewVisitorProvider>{children}</NewVisitorProvider>
                        </SignupWelcomeProvider>
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
