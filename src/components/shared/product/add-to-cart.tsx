"use client";

import React, { useState } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { addItem } from "src/store/features/cartSlice";
import clsx from "clsx";
import Link from "next/link";
import { ShoppingCart } from "lucide-react"; // Import the cart icon

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
  const [missingOption, setMissingOption] = useState(false); // Track if an option is missing

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => Math.max(prev - 1, 1));

  const handleAddToCart = () => {
    // Check if the item requires an option (modify this condition based on your logic)
    if (item.requiresOption && !item.selectedOption) {
      setMissingOption(true);
      setTimeout(() => setMissingOption(false), 500); // Remove shake after animation
      return;
    }

    dispatch(addItem({ item, quantity }));

    if (!minimal) {
      router.push("/cart");
    }
  };

  return minimal ? (
    <button
      onClick={handleAddToCart}
      className={clsx(
        "group relative rounded-full border border-[#1B6013] bg-[#1B6013] p-2 text-md font-semibold overflow-hidden flex items-start justify-start",
        className
      )}
    >
      <div
        className="absolute left-0 top-0 flex h-full w-11 items-center justify-end rounded-full transition-all duration-500 ease-in-out group-hover:w-full"
        style={{ backgroundColor: "#1B6013" }}
      >
        <span className="mr-3 text-white transition-all duration-500 ease-in-out">
          <ShoppingCart size={20} /> 
        </span>
      </div>
      <span className="relative left-4 z-10 whitespace-nowrap px-8 font-medium text-black hover:text-white transition-all duration-500 ease-in-out group-hover:-left-3">
        Add to Cart
      </span>
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
        <Link
          href={"/checkout"}
          className="text-white bg-[#1B6013] rounded-[8px] px-3 sm:px-[20px] py-3 text-xs lg:text-[16px] w-full flex justify-center items-center"
        >
          Buy Now
        </Link>
        <button
          onClick={handleAddToCart}
          className={clsx(
            "group relative rounded-full border border-[#1B6013] bg-[#1B6013] p-2 text-xl font-semibold overflow-hidden",
            missingOption && "animate-shake border border-red-500",
            className
          )}
        >
          <div
            className="absolute left-0 top-0 flex h-full w-11 items-center justify-end rounded-full transition-all duration-500 ease-in-out group-hover:w-full"
            style={{ backgroundColor: "#1B6013" }}
          >
            <span className="mr-3 text-white transition-all duration-700 ease-in-out">
              <ShoppingCart size={20} />
            </span>
          </div>
          <span className="relative left-4 z-10 whitespace-nowrap px-8 font-semibold text-white transition-all duration-500 ease-in-out group-hover:-left-3">
            Add to Cart
          </span>
        </button>
      </div>
    </div>
  );
};

export default AddToCart;