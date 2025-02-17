"use client";

import { Separator } from "@components/ui/separator";
import React, { useState } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { OrderItem } from "src/types";
import { useDispatch } from "react-redux";
// import { addItem } from '@/store/features/cartSlice'
import { useRouter } from "next/navigation";
import { addItem } from "src/store/features/cartSlice";


const AddToCart = ({
  item,
  minimal = false,
}: {
  item: any;
  minimal?: boolean;
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const handleIncrement = () => {
    setQuantity((prev) => (prev + 1));
  };

  const handleDecrement = () => {
    setQuantity((prev) => (prev - 1));
  };

  const handleAddToCart = () => {
    dispatch(addItem({ item, quantity }));
    if (!minimal) router.push("/cart");
  };

  return minimal ? (
    <button
      onClick={handleAddToCart}
      className="text-white bg-[#1B6013] rounded-[6px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] w-full"
    >
      Add to Cart
    </button>
  ) : (
    <div className="">
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
          className="text-[#284625] bg-[#F2F8F1] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] w-full"
        >
          Add to Cart
        </button>

      </div>
    </div>
  )
  // <>
  {/* <div className="">
        <div className="flex flex-col gap-[5px]">
          {datas.map((data) => (
            <div className="" key={data.id}>
              <p className="h6-bold">{data.title}</p>
              <p className="h6-light">{data.description}</p>
            </div>
          ))}
        </div>
      </div>
      <Separator className="mt-4 mb-2" />
      <div className="flex flex-col gap-2">
        <p className="h6-bold">Quantity</p>
        <div className="">
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
      </div> */}

  {/* <div className="flex flex-col gap-3 py-4">
      </div>{" "} */}
  {/* </> */ }
  {/* ); */ }
};

export default AddToCart;
