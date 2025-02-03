import type { Metadata } from "next";
// import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Inter } from "next/font/google";
import localFont from 'next/font/local'
 
// import { getServerSession } from "next-auth";
// import AuthSessionProvider from "@providers/AuthSessionProvider";
// import AntdConfigProvider from "@providers/AntdConfigProvider";
// import "@styles/globals.sass";
import "../app/global.css";
import Header from "@components/shared/header";
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

export const metadata: Metadata = {
  title: "Full-stack starter template 2024",
  description: "NextJs + NextAuth + Typescript + Mongo DB + Ant Design",
  icons: { icon: "/logos/next-icon.svg" }
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
              {/* <Header /> */}
              {children}
            </body>
          {/* </AuthSessionProvider> */}
        {/* </AntdConfigProvider> */}
      {/* </AntdRegistry> */}
    </html>
  );
}
