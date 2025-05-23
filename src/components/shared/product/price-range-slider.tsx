"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { Range } from "react-range";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatNaira } from "src/lib/utils";
import debounce from "lodash/debounce";

const PriceRangeSlider = ({
  params,
  maxPrice,
}: {
  params: any;
  maxPrice: number;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const priceParam = searchParams.get("price");
  const isInitialMount = useRef(true);

  // Calculate step based on maxPrice
  const step = Math.max(100, Math.floor(maxPrice / 100));

  // Initialize values from URL or defaults
  const [values, setValues] = useState<[number, number]>(() => {
    if (priceParam && priceParam !== "all") {
      const [min, max] = priceParam.split("-").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        return [Math.max(0, min), Math.min(maxPrice, max)];
      }
    }
    return [0, maxPrice];
  });

  // Create a debounced URL update function
  const debouncedUpdateUrl = useCallback(
    debounce((newValues: [number, number]) => {
      const newParams = new URLSearchParams(searchParams.toString());

      if (newValues[0] === 0 && newValues[1] === maxPrice) {
        newParams.delete("price");
      } else {
        newParams.set("price", `${newValues[0]}-${newValues[1]}`);
      }

      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }, 500),
    [maxPrice, pathname, router, searchParams]
  );

  // Handle value changes
  const handleChange = useCallback(
    (newValues: number[]) => {
      setValues([newValues[0], newValues[1]]);
      debouncedUpdateUrl([newValues[0], newValues[1]]);
    },
    [debouncedUpdateUrl]
  );

  // Handle URL parameter changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (priceParam) {
      if (priceParam === "all") {
        setValues([0, maxPrice]);
      } else {
        const [min, max] = priceParam.split("-").map(Number);
        if (!isNaN(min) && !isNaN(max)) {
          setValues([Math.max(0, min), Math.min(maxPrice, max)]);
        }
      }
    }
  }, [priceParam, maxPrice]);

  // Cleanup debounced function
  useEffect(() => {
    return () => {
      debouncedUpdateUrl.cancel();
    };
  }, [debouncedUpdateUrl]);

  return (
    <div className="w-full px-4 py-6">
      <div className="flex justify-between mb-4">
        <span className="text-sm text-gray-600">{formatNaira(values[0])}</span>
        <span className="text-sm text-gray-600">{formatNaira(values[1])}</span>
      </div>
      <Range
        step={step}
        min={0}
        max={maxPrice}
        values={values}
        onChange={handleChange}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            className="h-1 w-full bg-gray-200 rounded-full"
            style={{
              background: `linear-gradient(to right, #1B6013 ${
                (values[0] / maxPrice) * 100
              }%, #1B6013 ${(values[0] / maxPrice) * 100}%, #1B6013 ${
                (values[1] / maxPrice) * 100
              }%, #e5e7eb ${(values[1] / maxPrice) * 100}%)`,
            }}
          >
            {children}
          </div>
        )}
        renderThumb={({ props }) => (
          <div
            {...props}
            className="h-4 w-4 rounded-full bg-white border-2 border-[#1B6013] shadow-md focus:outline-none focus:ring-2 focus:ring-[#1B6013] focus:ring-opacity-50"
          />
        )}
      />
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500">Min: {formatNaira(0)}</span>
        <span className="text-xs text-gray-500">
          Max: {formatNaira(maxPrice)}
        </span>
      </div>
    </div>
  );
};

export default PriceRangeSlider;
