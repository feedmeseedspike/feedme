/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
"use client";
import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaShoppingCart,
  FaUserCircle,
  FaClipboardList,
  FaHeart,
} from "react-icons/fa";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: FaHome, label: "Home" },
    { href: "/cart", icon: FaShoppingCart, label: "Cart" },
    { href: "/account/order", icon: FaClipboardList, label: "Orders" },
    { href: "/account/favourites", icon: FaHeart, label: "Favorites" },
    { href: "/account/profile", icon: FaUserCircle, label: "Account" },
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
          py-2 rounded-full backdrop-blur-md shadow-lg shadow-[#2A0E61]/50"
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
                  <item.icon
                    className={`text-2xl relative z-10 ${
                      isActive && "text-[#1B6013]"
                    }`}
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
