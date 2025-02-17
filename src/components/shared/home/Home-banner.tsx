import Container from "@components/shared/Container";
import { HomeCarousel } from "@components/shared/home/Home-carousel";
import Image from "next/image";
import React from "react";

const imgs = ["/banners/banner3.png", "/banners/banner4.png"];

const Banner = () => {
  return (
    <section className="pt-4 pb-5 md:pt-10 md:pb-10 lg:pb-20">
      <div className="flex items-stretch gap-2 md:gap-4 w-full h-full">
        <div className="basis-[896px]">
          <HomeCarousel />
        </div>

        <div className="basis-[444px] flex flex-col gap-2 md:gap-4">
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
