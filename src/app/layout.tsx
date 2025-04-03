import type { Metadata } from "next";
// import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Inter } from "next/font/google";
import localFont from 'next/font/local'
import { Toaster } from 'sonner';
 
// import { getServerSession } from "next-auth";
// import AuthSessionProvider from "@providers/AuthSessionProvider";
// import AntdConfigProvider from "@providers/AntdConfigProvider";
// import "@styles/globals.sass";
import "../app/global.css";
import Header from "@components/shared/header";
import { ReduxProvider } from "src/store/providers";
import { LocationProvider } from "@components/shared/header/Location";
import CustomScrollbar from "@components/shared/CustomScrollbar";
// import Header from "@components/shared/header/Header";

// Font files can be colocated inside of `pages`
const proxima = localFont({
  src: [
    {
      path: '../../public/fonts/proxima-nova/ProximaNova-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/proxima-nova/ProximaNova-Semibold.otf',
      weight: '600',
      style: 'semibold',
    },
  ],
  variable: "--font-proxima"
})
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL("https://feedme.seedspikeafrica.com/"),
  title: {
    template: "%s - FeedMe",
    default: "FeedMe - Real Food, Real Fast, Delivered in 3 Hours",
  },
  keywords: "fresh produce, farm-fresh delivery, organic food, grocery online shopping, healthy eating",
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
  // const session = await getServerSession();

  return (
    <html lang="en" className={proxima.variable}>
      {/* <AntdRegistry> */}
        {/* <AntdConfigProvider> */}
          {/* <AuthSessionProvider session={session}> */}
            <body className="font-custom">
            <CustomScrollbar>
              <LocationProvider>
              <ReduxProvider>
                {/* <Header /> */}
                {children}
                <Toaster />
              </ReduxProvider>
              </LocationProvider>
            </CustomScrollbar>
            </body>
          {/* </AuthSessionProvider> */}
        {/* </AntdConfigProvider> */}
      {/* </AntdRegistry> */}
    </html>
  );
}
