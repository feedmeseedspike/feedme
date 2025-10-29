"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@components/ui/badge";

export default function Riverbitee() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full md:max-w-[520px] md:mx-auto lg:max-w-full">
      <Link href="/product/riverbite" className="block h-full">
        <div className="relative h-full md:h-[360px] lg:h-full">
          <Image
            src="/RIVERBITEE.jpg"
            alt="Riverbitee Premium Smoked Catfish"
            width={350}
            height={300}
            className="w-full h-full hover:scale-105 transition-transform duration-300"
            priority
          />
          {/* <div className="absolute top-3 right-3">
            <Badge className="bg-green-600 text-white px-2 py-1 text-xs font-medium">
              Premium
            </Badge>
          </div> */}
        </div>
      </Link>
    </div>
  );
}
