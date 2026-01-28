import Footer from "@components/shared/footer";
import Header from "@components/shared/header";
import Headertags from "@components/shared/header/Headertags";
import React from "react";
import NotFoundUI from "./not-found-ui";

export const metadata = {
  title: {
    absolute: "Page Not Found",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const NotFound = () => {
  return (
    <div className="bg-[#F2F0E9] min-h-screen flex flex-col">
      <Header />
      <div className="hidden md:block border-b border-[#D1D1D1] py-2">
        <Headertags />
      </div>
      
      <NotFoundUI />

      <Footer />
    </div>
  );
};
export default NotFound;
