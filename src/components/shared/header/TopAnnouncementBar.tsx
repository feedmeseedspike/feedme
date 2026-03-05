"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Truck, ShieldCheck, Leaf, Gift } from "lucide-react";
import Link from "next/link";

export default function TopAnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const announcements = [
    {
      icon: <Gift className="w-4 h-4 text-[#F0800F]" />,
      text: "Refer a friend & get ₦2,000 off your next order!",
      link: "/account/referral",
      linkText: "Learn More",
    },
    {
      icon: <Truck className="w-4 h-4 text-[#3BCCFF]" />,
      text: "Delivered to your doorstep in 3 hours within lagos.",
    },
    {
      icon: <Sparkles className="w-4 h-4 text-[#fff836]" />,
      text: "New: Share your FeedMe cart with anyone in one tap!",
    },
    // {
    //   icon: <ShieldCheck className="w-4 h-4 text-white" />,
    //   text: "Quality guaranteed. Pay securely on delivery.",
    // },
  ];

  useEffect(() => {
    // Auto-rotate every 5 seconds
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#113f0c] text-white py-2 w-full overflow-hidden relative z-[60]">
      <div className="flex justify-center items-center h-4 sm:h-5 max-w-7xl md:mx-auto px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: "backOut" }}
            className="flex items-center justify-center gap-2 font-bold text-[10px] sm:text-xs tracking-wider uppercase w-full"
          >
            <div className="shrink-0">{announcements[currentIndex].icon}</div>
            <div className="flex items-center gap-1.5 min-w-0 max-w-[280px] sm:max-w-none">
              <span className="truncate">
                {announcements[currentIndex].text}
              </span>
              {announcements[currentIndex].link && (
                <Link
                  href={announcements[currentIndex].link}
                  className="underline underline-offset-2 hover:text-[#F0800F] transition-colors whitespace-nowrap shrink-0"
                >
                  {announcements[currentIndex].linkText}
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
