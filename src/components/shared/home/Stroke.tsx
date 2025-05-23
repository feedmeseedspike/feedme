"use client";

import React, { useEffect, useRef, useState } from "react";

const Stroke = () => {
  const pRef = useRef<HTMLHeadingElement | null>(null);
  const [pWidth, setPWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (pRef.current) {
        setPWidth(pRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <div>
      <div>
        <h1
          ref={pRef}
          className="text-xl md:text-2xl font-proxima font-bold text-gray-300 w-fit"
        >
          Shop From <span className="text-orange-500">Top Categories</span>
        </h1>
      </div>
      <div
        className="bg-green-800 h-1 mt-2 md:mt-4 rounded-md transition-all duration-300"
        style={{ width: `${pWidth}px` }}
      ></div>
      <hr />
    </div>
  );
};

export default Stroke;
