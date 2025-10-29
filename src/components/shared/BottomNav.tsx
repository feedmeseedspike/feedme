/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
"use client";
import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: "/bottom-iconss/home.svg", label: "Home" },
    { href: "/cart", icon: "/bottom-iconss/cart.svg", label: "Cart" },
    {
      href: "/account/order",
      icon: "/bottom-iconss/orders.svg",
      label: "Orders",
    },
    {
      href: "/account/wallet",
      icon: "/bottom-iconss/wallet.svg",
      label: "Wallet",
    },
    {
      href: "/account/profile",
      icon: "/bottom-iconss/account.svg",
      label: "Account",
    },
  ];

  return (
    <AnimatePresence>
      <motion.nav
        key={1}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={BottomNavAnimations}
        className="md:hidden fixed bottom-2 left-1/2 -translate-x-1/2 z-50 flex justify-center px-4 
          py-1 rounded-2xl backdrop-blur-md shadow-lg shadow-[#2A0E61]/50"
      >
        <ul className="flex items-center text-xs sm:text-sm sm:gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <motion.li key={item.href} className="relative" layout>
                <Link
                  href={item.href}
                  prefetch={true}
                  className="relative z-10 flex flex-col items-center gap-1 text-black/80  px-3 py-1"
                >
                  {isActive && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        transition={{
                          layout: {
                            duration: 0.2,
                            ease: "easeInOut",
                            delay: 0.2,
                          },
                        }}
                        layoutId="bottom-nav-active-highlight"
                        className="absolute inset-0 rounded-full z-0"
                      />
                      <motion.div
                        transition={{
                          layout: {
                            duration: 0.4,
                            ease: "easeInOut",
                            delay: 0.04,
                          },
                        }}
                        layoutId="bottom-nav-active-highlight-wobbly-1"
                        className="absolute inset-0 bg-white/10 rounded-full z-0"
                      />
                      <motion.div
                        transition={{
                          layout: {
                            duration: 0.4,
                            ease: "easeOut",
                            delay: 0.2,
                          },
                        }}
                        layoutId="bottom-nav-active-highlight-wobbly-2"
                        className="absolute inset-0 bg-white/5 rounded-full z-0"
                      />
                    </AnimatePresence>
                  )}
                  <img
                    src={item.icon}
                    alt={item.label}
                    className={`w-6 h-6 relative z-10 ${isActive ? "grayscale-0" : "grayscale"}`}
                  />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </motion.nav>
    </AnimatePresence>
  );
}

const BottomNavAnimations = {
  initial: {
    y: 50,
    x: "-50%",
    opacity: 0,
  },
  animate: {
    y: 0,
    x: "-50%",
    opacity: 1,
    transition: {
      damping: 10,
      stiffness: 100,
    },
  },
  exit: {
    y: 50,
    opacity: 0,
  },
};
