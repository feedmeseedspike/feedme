import Container from "@components/shared/Container";
import { HomeCarousel } from "@components/shared/home/Home-carousel";
import Image from "next/image";
import Link from "next/link";
import React from "react";

// This would typically come from your database/API
const banners = [
  {
    id: 1,
    imageUrl: "/banners/banner3.png",
    tag: "todays-deal",
    active: true,
  },
  {
    id: 2,
    imageUrl: "/banners/banner4.png",
    tag: "fresh-fruits",
    active: true,
  },
];

const Banner = () => {
  return (
    <section className="pt-4 pb-5 md:pt-10 md:pb-10 lg:pb-20 w-full">
      <div className="md:flex items-stretch gap-2 md:gap-4 w-full h-full">
        <div className="basis-[896px]">
          <HomeCarousel />
        </div>

        <div className="md:basis-[444px] w-full flex flex-row md:flex-col gap-2 mt-3 md:mt-0 md:gap-4">
          {banners.map((banner) => (
            <Link
              href={`/${banner.tag}`}
              key={banner.id}
              className="w-1/2 md:w-full md:h-1/2 hover:opacity-90 transition-opacity"
            >
              <Image
                src={banner.imageUrl}
                alt={`${banner.tag} banner`}
                width={445}
                height={700}
                className="w-full h-full"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Banner;
