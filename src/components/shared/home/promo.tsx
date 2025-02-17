"use client"

import Image from 'next/image'
import React from 'react'
import { formatNaira } from 'src/lib/utils'

const promos = [
  {
    id: 1,
    title: "Riverbite Discount",
    discount: "10% OFF",
    oldPrice: 6425,
    newPrice: 5850,
    bgColor: "#1B6013",
    imageUrl: "/images/riverbite.png",
  },
  {
    id: 2,
    title: "FeedMe Black Friday",
    discount: "BEST DEALS",
    oldPrice: 6425,
    newPrice: 5850,
    bgColor: "#000000",
    imageUrl: "/images/fruits.png",
  },
  {
    id: 3,
    title: "100% Fresh Fruit",
    discount: "SUMMER SALE",
    extraDiscount: "64% OFF",
    bgColor: "#F0800F",
    imageUrl: "/images/lemon.png",
  },
]

const Promo = () => {
  return (
    <section className="flex flex-col my-10 gap-20">
      {/* Heading */}
      <div className="flex flex-col gap-6 max-w-[40rem] mx-auto text-center">
        <h1 className="text-3xl md:text-6xl font-semibold md:leading-[3] font-proxima">
          Order Today And{" "} <br />
          <span className="bg-[#161B20] mt-2 rounded-xl text-white px-3 py-1 inline-block rotate-[1.5deg]">
            Save Up To
          </span>{" "}
          20%!
        </h1>
        <p className="text-gray-500">Save when you order from FeedMe&apos;s top deals</p>
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
            <h1 className="text-3xl md:text-4xl text-white font-semibold pt-4">{promo.title}</h1>

            {promo.oldPrice && promo.newPrice && (
              <div className="flex gap-2 items-center justify-center pt-4">
                <p className="line-through text-white">{formatNaira(promo.oldPrice)}</p>
                <p className="text-white font-bold">{formatNaira(promo.newPrice)}</p>
              </div>
            )}

            {promo.extraDiscount && (
              <div className="flex gap-2 items-center justify-center pt-4">
                <p className="text-white">Up to</p>
                <h1 className="bg-[#161B20] rounded-xl text-white text-2xl px-4 py-1">{promo.extraDiscount}</h1>
              </div>
            )}

            <button className="text-[#1B6013] relative z-50 rounded-lg px-6 py-3 bg-white font-semibold mt-12">
              Shop Now
            </button>

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
  )
}

export default Promo
