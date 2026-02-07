"use client";

import Image from "next/image";
import React from "react";

const features = [
  {
    title: "Secured online payment",
    description: "Enjoy a seamless shopping experience with our secured payment system.",
    icon: "/images/features/secured-payment.png",
  },
  {
    title: "100% full fresh quality",
    description: "Experience premium freshness and top-notch quality in every product.",
    icon: "/images/features/fresh-quality.png",
  },
  {
    title: "Get delivery up to 3 hours",
    description: "Enjoy swift delivery within 3 hours, right to your doorstep.",
    icon: "/images/features/fast-delivery.png",
  },
];

const StoreFeatures = () => {
  return (
    <div className="pb-8 md:pb-12">
      <div className="bg-white rounded-md p-2 md:p-2 lg:p-3 border border-gray-200 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group p-5 md:p-6 lg:p-8 flex items-center gap-4 lg:gap-6 first:rounded-t-[20px] last:rounded-b-[20px] md:first:rounded-l-[28px] md:first:rounded-tr-none md:last:rounded-r-[28px] md:last:rounded-bl-none"
          >
            <div className="relative w-12 h-12 lg:w-16 lg:h-16 flex-shrink-0 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
              <Image
                src={feature.icon}
                alt={feature.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 48px, 64px"
              />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[15px] lg:text-[17px] font-bold text-[#1D2939] leading-tight group-hover:text-[#1B6013] transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-[12px] lg:text-[14px] text-gray-500 mt-1 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreFeatures;

