"use client";

import { Separator } from "@components/ui/separator";
import React, { useState } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { addItem } from "src/store/features/cartSlice";
import clsx from "clsx";

const AddToCart = ({
  item,
  minimal = false,
  className, 
}: {
  item: any;
  minimal?: boolean;
  className?: string;
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity((prev) => prev - 1);
  };

  const handleAddToCart = () => {
    dispatch(addItem({ item, quantity }));
    if (!minimal) router.push("/cart");
  };

  return minimal ? (
    <button
      onClick={handleAddToCart}
      className={clsx(
        "text-white bg-[#1B6013] rounded-[6px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] w-full",
        className
      )}
    >
      Add to Cart
    </button>
  ) : (
    <div>
      <div className="flex flex-col gap-2">
        <p className="h6-bold">Quantity</p>
        <div className="py-3">
          <button
            onClick={handleDecrement}
            disabled={quantity <= 1}
            className="bg-[#F5F5F5] disabled:border-zinc-100 p-2 rounded-full"
          >
            <AiOutlineMinus className="w-3 h-3" />
          </button>
          <span className="w-12 font-bold inline-block text-center">
            {quantity}
          </span>
          <button
            onClick={handleIncrement}
            disabled={quantity >= 100}
            className="bg-[#F5F5F5] disabled:border-zinc-100 p-2 rounded-full"
          >
            <AiOutlinePlus className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button className="text-white bg-[#1B6013] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] w-full">
          Buy Now
        </button>
        <button
          onClick={handleAddToCart}
          className={clsx(
            "text-[#284625] bg-[#F2F8F1] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] w-full",
            className
          )}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default AddToCart;
