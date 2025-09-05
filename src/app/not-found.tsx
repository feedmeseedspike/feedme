import Headertags from "@/components/shared/header/Headertags";
import Footer from "@components/shared/footer";
import Header from "@components/shared/header";
import Image from "next/image";
import React from "react";

export const metadata = {
  title: {
    absolute: "Not Found",
  },
};


const NotFound = () => {
  return (
    <>
      <Header />
      <Headertags/>
      {/* <Header * /}
      <section className="flex justify-center items-center bg-white">
        <Image
          src="/404.gif"
          alt="not found"
          height={600}
          width={800}
          className="max-w-full"
        />
      </section>
      {/* <Footer /> */}
    </>
  );
};
export default NotFound;