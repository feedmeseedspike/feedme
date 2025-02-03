import Container from "@components/shared/Container";
import { HomeCarousel } from "@components/home/Home-carousel";
import Image from "next/image";
import React from "react";

const imgs = ["/banners/banner3.png", "/banners/banner4.png"];

const Banner = () => {
  return (
    <section className="pt-4 pb-5 md:pt-10 md:pb-20">
      <div className="flex items-stretch gap-2 md:gap-4 w-full">
        {/* Carousel: Taller height on mobile */}
        <div className="w-[70%] md:w-[75%]">
          <HomeCarousel />
        </div>

        {/* Side images: Combined height equals the carousel height */}
        <div className="w-[30%] md:w-[25%] flex flex-col gap-2 md:gap-4">
          {imgs.map((imgSrc, idx) => (
            <div key={idx} className="h-1/2">
              <Image
                src={imgSrc}
                alt=""
                width={445}
                height={150}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};




export default Banner;
