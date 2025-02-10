"use client";

import React, { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { Label } from "@components/ui/label";
import Image from "next/image";
import { formatNaira } from "src/lib/utils";
import clsx from "clsx";

const OptionSelector = ({ options }: { options: { name: string; price: number; image: string }[] }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const handleAddToCart = () => {
    if (!selectedOption) {
      setShake(true);
      setTimeout(() => setShake(false), 500); // Remove shake effect after animation
    } else {
      console.log("Added to cart:", selectedOption);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-[10px]">
        <p className="h4-bold">Select Option</p>
        <p className={clsx("badge transition", { "animate-shake": shake })}>Required</p>
      </div>
      <RadioGroup onValueChange={setSelectedOption}>
        {options.map((option) => (
          <div key={option.name} className="flex items-center justify-between">
            <Label htmlFor={option.name} className="flex items-center gap-4">
              <Image
                width={54}
                height={54}
                src={option.image}
                alt={option.name}
                className="size-[54px] rounded-[5px] border-[0.31px] border-[#81a6e2]"
              />
              <div className="flex flex-col gap-[4px]">
                <p className="h4-bold">{option.name}</p>
                <p>{formatNaira(option.price)}</p>
              </div>
            </Label>
            <RadioGroupItem value={option.name} id={option.name} />
          </div>
        ))}
      </RadioGroup>
      <button
        className="text-[#284625] bg-[#F2F8F1] rounded-[8px] px-3 py-3 w-full"
        onClick={handleAddToCart}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default OptionSelector;
