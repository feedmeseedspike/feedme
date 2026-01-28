"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const NotFoundUI = () => {
  return (
    <main className="w-full flex flex-col items-center justify-center py-8 bg-white text-center font-quicksand px-4">
      
      {/* Visuals Container */}
      <div className="relative flex flex-col items-center">
        
        {/* Large 404 Text */}
        <h1 className="text-[100px] md:text-[160px] font-black text-[#222222] -leading-[2.8] tracking-widest select-none">
          404
        </h1>

        {/* Illustration - Pulled up to overlap */}
        <div className="relative w-[220px] h-[220px] md:w-[280px] md:h-[280px] z-10 -mt-10 md:-mt-16">
          <Image
            src="/images/simple-404-box.png"
            alt="Delivery Box"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Message and Button */}
      <div className="space-y-4 max-w-md z-20 mt-2">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Delivery Not Found
          </h2>
          <p className="text-gray-500 text-base font-medium">
            It looks like this page got lost in the mail.
          </p>
        </div>
        
        <Link href="/" passHref>
          <Button 
            className="bg-[#1B6013] hover:bg-[#154d0f] text-white font-bold text-base px-10 mt-2 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 w-auto"
          >
            GO TO HOMEPAGE
          </Button>
        </Link>
      </div>

    </main>
  );
};

export default NotFoundUI;
