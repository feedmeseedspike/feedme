"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatNaira } from "src/lib/utils";
import Link from "next/link";
import { usePromotionsQuery } from "../../../queries/promotions";
import { Database } from "../../../utils/database.types";

type Promotion = Database["public"]["Tables"]["promotions"]["Row"];

const Promo = () => {
  const { data: promotions, isLoading, error } = usePromotionsQuery();

  const countdownPromo = promotions?.find(
    (promo: Promotion) => promo.countdown_end_time !== null
  );

  const initialTimeLeft = countdownPromo?.countdown_end_time
    ? Math.max(
        0,
        Math.floor(
          (new Date(countdownPromo.countdown_end_time).getTime() -
            new Date().getTime()) /
            1000
        )
      )
    : 0;

  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);

  useEffect(() => {
    if (countdownPromo?.countdown_end_time) {
      const newTimeLeft = Math.max(
        0,
        Math.floor(
          (new Date(countdownPromo.countdown_end_time).getTime() -
            new Date().getTime()) /
            1000
        )
      );
      setTimeLeft(newTimeLeft);
    }
  }, [countdownPromo?.countdown_end_time]);

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

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

  if (isLoading) {
    return <div>Loading Promotions...</div>;
  }

  if (error) {
    console.error("Error fetching promotions:", error);
    return <div>Error loading promotions.</div>;
  }

  if (!promotions || promotions.length === 0) {
    return null;
  }

  // Filter promotions to show only those featured on the homepage
  const featuredPromotions = promotions.filter(
    (promo: Promotion) => promo.is_featured_on_homepage === true
  );

  // If no featured promotions, render nothing
  if (featuredPromotions.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col  md:my-6 gap-14 md:gap-20">
      <div className="flex flex-col gap-6 max-w-[40rem] mx-auto text-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold font-proxima">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
        {featuredPromotions
          .filter((promo: Promotion) => !!promo.id)
          .map((promo: Promotion) => (
            <div
              key={promo.id!}
              className="rounded-3xl h-[500px] md:h-[600px] relative pt-10 flex flex-col items-center text-center overflow-hidden"
              style={{ backgroundColor: promo.background_color || "#ffffff" }}
            >
              {promo.discount_text && (
                <p className="text-white font-semibold">
                  {promo.discount_text}
                </p>
              )}
              <h1 className="text-3xl md:text-4xl text-white font-semibold pt-4">
                {promo.title}
              </h1>

              <div className="flex flex-col min-h-[100px]">
                {promo.old_price && promo.new_price && (
                  <div className="flex gap-2 items-center justify-center pt-4">
                    <p className="line-through text-white">
                      {formatNaira(Number(promo.old_price))}
                    </p>
                    <p className="text-white font-bold">
                      {formatNaira(Number(promo.new_price))}
                    </p>
                  </div>
                )}

                {promo.extra_discount_text && (
                  <div className="flex gap-2 items-center justify-center pt-4">
                    <p className="text-white">Up to</p>
                    <h1 className="bg-[#161B20] rounded-xl text-white text-2xl px-4 py-1">
                      {promo.extra_discount_text}
                    </h1>
                  </div>
                )}

                {promo.id! === countdownPromo?.id &&
                  countdownPromo.countdown_end_time &&
                  timeLeft > 0 && (
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

              {promo.tag && promo.tag.trim() !== "" && (
                <Link
                  href={`/${promo.tag}`}
                  className="text-[#1B6013] relative z-10 rounded-lg px-6 py-3 bg-white font-semibold mt-12 inline-block hover:bg-gray-100 transition-colors"
                >
                  Shop Now
                </Link>
              )}

              <Image
                className="absolute bottom-0 w-full"
                src={promo.image_url || "/product-placeholder.png"}
                width={430}
                height={600}
                alt={promo.title || ""}
              />
            </div>
          ))}
      </div>
    </section>
  );
};

export default Promo;
