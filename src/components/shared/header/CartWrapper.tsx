"use client";

import { useMediaQuery } from "usehooks-ts";
import Link from "next/link";
import Cart from "./Cart";

export default function CartWrapper() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  if (isMobile) {
    return (
      <Link href="/cart" className="cursor-pointer">
        <Cart />
      </Link>
    );
  }
  
  return (
    <div className="cursor-pointer">
      <Cart />
    </div>
  );
}