"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Offer } from "@/app/(home)/offers/OffersClient";
import { useRouter } from "next/navigation";
import { toSlug } from "@/lib/utils";

export default function Carousel({
  data,
  setLoading,
}: {
  data: Offer[];
  setLoading: (val: boolean) => void;
}) {
  const carouselRef = useRef(null);

  const router = useRouter();

  useEffect(() => {
    const carousel: any = carouselRef.current;
    if (!carousel) return;

    const scrollWidth = carousel.scrollWidth;
    const clientWidth = carousel.clientWidth;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += clientWidth / 4; // Scroll by half a card width for smooth effect
      if (scrollPosition >= scrollWidth - clientWidth) {
        scrollPosition = 0; // Reset to start for infinite loop
      }
      carousel.scrollTo({ left: scrollPosition, behavior: "smooth" });
    };

    const interval = setInterval(scroll, 3000); // Auto-scroll every 3 seconds

    // Pause on hover
    carousel.addEventListener("mouseenter", () => clearInterval(interval));
    carousel.addEventListener("mouseleave", () => {
      setInterval(scroll, 3000);
    });

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 py-9">
        <h2 className="text-3xl text-black font-bold text-center mb-8">
          See Our Offers
        </h2>
        <div
          ref={carouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}>
          {data.map((product) => (
            <div
              onClick={() => {
                setLoading(true);
                router.push(`/offers/${toSlug(product.title)}`);
              }}
              key={product.id}
              className="flex-none w-[450px] relative snap-center bg-gray-100 rounded-lg shadow-md p-2 mx-2 transform hover:scale-105 transition-transform duration-300">
              <div className="absolute top-5 right-5 bg-green-500 text-white text-sm px-2 py-1 rounded-full">
                Buy Now
              </div>
              <Image
                src={product.image_url}
                alt={product.id}
                width={600}
                height={200}
                className="w-full h-60 object-cover rounded-xl mb-4"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold text-black">
                {product.title}
              </h3>
              <p className="text-black text-base">{product.description}</p>
              <p className="text-black text-base font-bold mt-5">
                N {product.price_per_slot}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            setLoading(true);
            router.push("/offers");
          }}
          className="w-full bg-green-600 text-white mt-10 font-semibold py-3 rounded-lg hover:bg-green-700 transition">
          View All Offers
        </button>
      </div>
      {/* Hide Scrollbar CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
