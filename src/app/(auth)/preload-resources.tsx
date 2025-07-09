"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LOGIN_BANNER_IMAGE } from "src/constants/images";

export type ReviewSlide = {
  imgSrc?: string;
  review: string;
  customer: string;
};

export const PreloadResource = ({ slides }: { slides: ReviewSlide[] }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayIntervalTime = 6000;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isPaused) {
      interval = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev < slides.length ? prev + 1 : 1));
      }, autoplayIntervalTime);
    }
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const currentSlide = slides[currentSlideIndex - 1];

  return (
    <div className="relative w-full max-w-full aspect-[4/3] overflow-hidden mx-auto">
      {/* Render the image ONCE with aspect ratio */}
      <Image
        src={currentSlide.imgSrc || LOGIN_BANNER_IMAGE}
        alt="Customer review background"
        fill
        className="object-cover object-top"
        priority
      />

      {/* Overlay the testimonial */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end gap-4 bg-gradient-to-t from-neutral-950/85 to-transparent px-16 py-12 text-center transition-opacity duration-1000 opacity-100">
        <p className="lg:w-[60%] w-full text-pretty text-xl text-neutral-100 italic">
          “{currentSlide.review}”
        </p>
        <span className="text-neutral-300 text-sm font-semibold">
          - {currentSlide.customer}
        </span>
      </div>

      {/* indicators */}
      <div
        className="absolute rounded-sm bottom-3 md:bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-4 md:gap-3 px-1.5 py-1 md:px-2"
        role="group"
        aria-label="slides"
      >
        {slides.map((_, index) => (
          <button
            key={index}
            className={`size-2 rounded-full transition ${
              currentSlideIndex === index + 1
                ? "bg-neutral-300"
                : "bg-neutral-300/50"
            }`}
            onClick={() => setCurrentSlideIndex(index + 1)}
            aria-label={`slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
