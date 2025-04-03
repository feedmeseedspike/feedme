"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatNaira } from "src/lib/utils";
import Link from "next/link";

const promos = [
  {
    id: 1,
    title: "Riverbite Discount",
    discount: "10% OFF",
    oldPrice: 6425,
    newPrice: 5850,
    bgColor: "#1B6013",
    imageUrl: "/images/riverbite.png",
    tag: "todays-deal",
  },
  {
    id: 2,
    title: "FeedMe Black Friday",
    discount: "BEST DEALS",
    bgColor: "#000000",
    imageUrl: "/images/fruits.png",
    countdown: 3 * 24 * 60 * 60,
    tag: "black-friday",
  },
  {
    id: 3,
    title: "100% Fresh Fruit",
    discount: "SUMMER SALE",
    extraDiscount: "64% OFF",
    bgColor: "#F0800F",
    imageUrl: "/images/lemon.png",
    tag: "fresh-fruits",
  },
];
const Promo = () => {
  const [timeLeft, setTimeLeft] = useState(promos[1].countdown);

  useEffect(() => {
    if (!timeLeft) return;

    const interval = setInterval(() => {
      setTimeLeft((prev: any) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (time: number) => {
    const days = String(Math.floor(time / (24 * 60 * 60))).padStart(2, "0");
    const hours = String(
      Math.floor((time % (24 * 60 * 60)) / (60 * 60))
    ).padStart(2, "0");
    const minutes = String(Math.floor((time % (60 * 60)) / 60)).padStart(
      2,
      "0"
    );
    const seconds = String(time % 60).padStart(2, "0");

    return { days, hours, minutes, seconds };
  };

  const { days, hours, minutes, seconds } = formatTime(timeLeft ?? 0);

  return (
    <section className="flex flex-col my-10 gap-20">
      {/* Heading */}
      <div className="flex flex-col gap-6 max-w-[40rem] mx-auto text-center">
        <h1 className="text-3xl md:text-6xl font-semibold font-proxima">
          Order Today And <br />
          <span className="bg-[#161B20] mt-2 rounded-xl text-white px-3 py-1 inline-block rotate-[1.5deg]">
            Save Up To
          </span>{" "}
          20%!
        </h1>
        <p className="text-gray-500">
          Save when you order from FeedMe&apos;s top deals
        </p>
      </div>

      {/* Promo Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
        {promos.map((promo) => (
          <div
            key={promo.id}
            className="rounded-3xl h-[600px] lg:h-[650px] relative pt-10 flex flex-col items-center text-center overflow-hidden"
            style={{ backgroundColor: promo.bgColor }}
          >
            <p className="text-white font-semibold">{promo.discount}</p>
            <h1 className="text-3xl md:text-4xl text-white font-semibold pt-4">
              {promo.title}
            </h1>

            <div className="flex flex-col min-h-[100px]">
              {promo.oldPrice && promo.newPrice && (
                <div className="flex gap-2 items-center justify-center pt-4">
                  <p className="line-through text-white">
                    {formatNaira(promo.oldPrice)}
                  </p>
                  <p className="text-white font-bold">
                    {formatNaira(promo.newPrice)}
                  </p>
                </div>
              )}

              {promo.extraDiscount && (
                <div className="flex gap-2 items-center justify-center pt-4">
                  <p className="text-white">Up to</p>
                  <h1 className="bg-[#161B20] rounded-xl text-white text-2xl px-4 py-1">
                    {promo.extraDiscount}
                  </h1>
                </div>
              )}

              {promo.countdown && (
                <motion.div
                  className="mt-6 text-white flex items-center gap-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex flex-col gap-2">
                    <div className="font-semibold text-3xl">{days}</div>
                    <span className="text-base">DAYS</span>
                  </div>
                  <span className="">:</span>
                  <div className="flex flex-col gap-2">
                    <div className="font-semibold text-3xl">{hours}</div>
                    <span className="">HOURS</span>
                  </div>
                  <span className="">:</span>
                  <div className="flex flex-col gap-2">
                    <div className="font-semibold text-3xl">{minutes}</div>
                    <span className="">MINS</span>
                  </div>
                  <span className="">:</span>
                  <div className="flex flex-col gap-2">
                    <div className="font-semibold text-3xl">{seconds}</div>
                    <span className="">SECS</span>
                  </div>
                </motion.div>
              )}
            </div>

            <Link
              href={`/${promo.tag}`}
              className="text-[#1B6013] relative z-50 rounded-lg px-6 py-3 bg-white font-semibold mt-12 inline-block"
            >
              Shop Now
            </Link>

            <Image
              className="absolute bottom-0 w-full"
              src={promo.imageUrl}
              width={430}
              height={600}
              alt=""
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Promo;
