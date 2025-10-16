import Footer from "@components/shared/footer";
import Header from "@components/shared/header";
import Headertags from "@components/shared/header/Headertags";
import Image from "next/image";
import React from "react";

export const metadata = {
  title: {
    absolute: "Not Found",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const NotFound = () => {
  return (
    <>
    {/* <Header />
    <Headertags /> */}
      <section className="flex justify-center items-center bg-white">
        <Image
          src="/404.gif"
          alt="not found"
          height={600}
          width={800}
          className="max-w-full"
        />
      </section>
      <Footer />
    </>
  );
};
export default NotFound;