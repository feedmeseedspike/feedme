import Container from "@components/shared/Container";
import { HomeCarousel } from "@components/home/Home-carousel";
import Image from "next/image";
import React from "react";

const imgs = ["/banners/banner3.png", "/banners/banner4.png"];

const Banner = () => {
  return (
    <Container>
      <section className="flex items-center gap-4 py-6">
        <div className="w-[75%]">
          <HomeCarousel />
        </div>
        <div className="w-[25%]">
          <div className="flex flex-col gap-4">
            {imgs.map((imgSrc, idx) => {
              return (
                <div key={idx} className="">
                  <Image
                    src={imgSrc}
                    alt={""}
                    width={445}
                    height={150}
                    // fill
                    // sizes="100vw"
                    className="w-full object-cove"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Container>
  );
};

export default Banner;
