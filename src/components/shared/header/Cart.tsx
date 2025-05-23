"use client";

import ShoppingCart from "@components/icons/cart.svg";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/ui/sheet";
import { ArrowLeft, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { formatNaira } from "src/lib/utils";
import { RootState } from "src/store";
import {
  removeItem,
  updateItem,
  clearCart,
} from "src/store/features/cartSlice";
import { OrderItem } from "src/types";
import { Input } from "@components/ui/input";
import Link from "next/link";
import { useMediaQuery } from "usehooks-ts";

const Cart = ({ asLink = false }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart);
  const { items, itemsPrice } = cart;

  const handleCheckout = () => {
    router.push("/checkout");
  };

  const handleQuantityChange = (item: OrderItem, increment: boolean) => {
    const newQuantity = increment ? item.quantity + 1 : item.quantity - 1;
    if (newQuantity > 0) {
      dispatch(updateItem({ item, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (item: OrderItem) => {
    dispatch(
      removeItem({
        productId: item.product,
        selectedOption: item.selectedOption,
      })
    );
  };

  const handleClearItem = () => {
    dispatch(clearCart());
  };

  const totalQuantity = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  if (asLink) {
    return (
      <div className="relative">
        <ShoppingCart className="size-[24px]" />
        {items.length > 0 && (
          <p className="absolute -top-2 -right-2 bg-[#D0D5DD] px-[7px] py-[2px] rounded-full text-xs text-white">
            {totalQuantity}
          </p>
        )}
      </div>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="relative cursor-pointer">
          <ShoppingCart className="size-[24px]" />
          {items.length > 0 && (
            <p className="absolute -top-2 -right-2 bg-[#D0D5DD] px-[7px] py-[2px] rounded-full text-xs text-white">
              {totalQuantity}
            </p>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-4 md:!max-w-xl">
        <SheetHeader className="flex justify-between w-full items-center">
          <SheetClose className="rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <ArrowLeft className="size-[22px]" />
          </SheetClose>
          <SheetTitle className="h2-bold flex-1 text-center">
            Cart ({totalQuantity})
          </SheetTitle>
          {items.length > 0 && (
            <p
              className="badge cursor-pointer w-fit select-none"
              onClick={handleClearItem}
            >
              Clear Cart
            </p>
          )}
        </SheetHeader>

        <div className="flex grow flex-col space-y-5 overflow-y-auto pt-1">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p className="text-lg font-semibold">Your cart is empty.</p>
              <p className="text-sm text-gray-400">
                Start adding items to your cart!
              </p>
            </div>
          ) : (
            items.map((item: OrderItem) => (
              <React.Fragment key={`${item.clientId}-${item.name}`}>
                <div className="flex items-center gap-3 sm:gap-4 overflow-y-visible">
                  <Link href={`/product/${item.slug}`}>
                    <Image
                      width={64}
                      height={64}
                      src={item.image}
                      alt={item.name}
                      className="h-[64px] rounded-[5px] border-[0.31px] border-[#DDD5DD] object-contain"
                    />
                  </Link>
                  <div className="flex flex-col gap-[6px] w-full">
                    <div className="flex justify-between">
                      <p className="h6-light !text-[14px]">{item.name}</p>
                      <Trash2Icon
                        className="size-4"
                        onClick={() => handleRemoveItem(item)}
                        aria-label="Remove item"
                      />
                    </div>
                    {item.selectedOption && (
                      <p className="text-[8px] text-[#344054] bg-[#F2F4F7] rounded-[16px] w-fit px-2 py-[2px]">
                        {item.selectedOption}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <p className="text-[#101828] font-bold">
                        {formatNaira(item.price)}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-[9px] bg-[#D0D5DD] rounded-[4px] p-3 text-white"
                          onClick={() => handleQuantityChange(item, false)}
                        >
                          <AiOutlineMinus />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-[9px] bg-[#1B6013] rounded-[4px] p-3 text-white"
                          onClick={() => handleQuantityChange(item, true)}
                        >
                          <AiOutlinePlus />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <Separator />
              </React.Fragment>
            ))
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="mt-auto">
            <div className="w-full">
              <Separator className="my-2" />
              <div className="h4-light flex justify-between">
                <p>Subtotal</p>
                <p>{formatNaira(itemsPrice)}</p>
              </div>
              <div className="flex w-full items-center pt-[10px] gap-3">
                <Input
                  type="email"
                  placeholder="Discount Code"
                  className="h-10 placeholder:text-xs text-[#737373] placeholder:font-semibold"
                />
                <Button
                  type="submit"
                  className="btn-primary !text-[#B7CDB4] !bg-[#F2F4F7] h-10"
                >
                  Apply
                </Button>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-[14px] text-[#101828]">
                <p>Total</p>
                <p>{formatNaira(itemsPrice)}</p>
              </div>
              <button
                className="mt-3 w-full btn-primary"
                onClick={handleCheckout}
              >
                Checkout
              </button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default Cart;
