"use client"

import React, { useEffect, useRef, useState } from 'react'

const Stroke = () => {
  const pRef = useRef(null);
  const [pWidth, setPWidth] = useState(0);

  useEffect(() => {
    if (pRef?.current) {
      setPWidth(pRef?.current?.offsetWidth);
    }
  }, [pWidth]);

  return (
    <div>
      <div className="">
          <h1
            ref={pRef}
            className="text-xl md:text-2xl py-4 font-bold text-gray-300 w-fit"
          >
            Shop From <span className="text-orange-500">Top Categories</span>
          </h1>

        </div>
        <div
          className="bg-green-800 h-1 rounded-md"
          style={{ width: `${pWidth}px` }}
        ></div>
        <hr />
    </div>
  )
}

export default Stroke