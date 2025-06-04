"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export type ReviewSlide = {
  imgSrc: string;
  review: string;
  customer: string;
};

export const PreloadResource = ({ slides }: { slides: ReviewSlide[] }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayIntervalTime = 4000;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!isPaused) {
      interval = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev < slides.length ? prev + 1 : 1));
      }, autoplayIntervalTime);
    }

    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const handlePrevious = () => {
    setCurrentSlideIndex((prev) => (prev > 1 ? prev - 1 : slides.length));
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev < slides.length ? prev + 1 : 1));
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* slides */}
      <div className="relative min-h-[100dvh] w-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlideIndex === index + 1 ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Review and customer name */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-end gap-4 bg-gradient-to-t from-neutral-950/85 to-transparent px-16 py-12 text-center">
              <p className="lg:w-1/2 w-full text-pretty text-lg text-neutral-100 italic">
                “{slide.review}”
              </p>
              <span className="text-neutral-300 text-sm font-semibold">
                - {slide.customer}
              </span>
            </div>
            <Image
              src={slide.imgSrc}
              alt="Customer review background"
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Pause/Play Button */}
      <button
        type="button"
        className="absolute bottom-5 right-5 z-20 rounded-full text-neutral-300 opacity-50 transition hover:opacity-80 focus-visible:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:outline-offset-0"
        onClick={togglePause}
        aria-label="pause carousel"
        aria-pressed={isPaused}
      >
        {isPaused ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-7"
          >
            <path
              fillRule="evenodd"
              d="M2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm6.39-2.908a.75.75 0 0 1 .766.027l3.5 2.25a.75.75 0 0 1 0 1.262l-3.5 2.25A.75.75 0 0 1 8 12.25v-4.5a.75.75 0 0 1 .39-.658Z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-7"
          >
            <path
              fillRule="evenodd"
              d="M2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm5-2.25A.75.75 0 0 1 7.75 7h.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75v-4.5Zm4 0a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75v-4.5Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

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
