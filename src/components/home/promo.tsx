"use client"

import React, { useEffect, useRef, useState } from 'react'

const Promo = () => {

  return (
      <section className="">
        <div className="flex flex-col gap-[24px] max-w-[40rem] mx-auto">
          <h1 className='text-[2rem] md:text-[4.2rem] leading-[4rem] md:leading-[5.8rem] font-semibold text-center font-proxima'>Order Today And <span className="bg-[#161B20] rounded-[24px] text-white p-2 whitespace-nowrap transform -rotate-[1.5deg]">Save Up To</span>20%!</h1>
          <p className="text-[#475467] text-center">Save when you order from FeedMe&apos;s top deals</p>
        </div>
      </section>
  )
}

export default Promo