"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Truck, ShieldCheck, Leaf, Gift } from "lucide-react";
import Link from "next/link";
import { BONUS_CONFIG } from "../../../lib/deals";

const CountdownDisplay = () => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number; label: string } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const start = new Date(BONUS_CONFIG.PROMO_FREE_DELIVERY_2PM.start_date);
      const end = new Date(BONUS_CONFIG.PROMO_FREE_DELIVERY_2PM.end_date);
      
      if (now < start) {
        return { diff: start.getTime() - now.getTime(), label: "PROMO STARTS IN:" };
      }
      if (now > end) return null;

      // Daily cutoff is 2:00 PM
      const today2pm = new Date(now);
      today2pm.setHours(14, 0, 0, 0);

      if (now < today2pm) {
        return { diff: today2pm.getTime() - now.getTime(), label: "ORDER BEFORE 2PM. ENDS IN:" };
      } else {
        const tomorrow2pm = new Date(now);
        tomorrow2pm.setDate(tomorrow2pm.getDate() + 1);
        tomorrow2pm.setHours(14, 0, 0, 0);

        if (tomorrow2pm > end) return null;

        return { diff: tomorrow2pm.getTime() - now.getTime(), label: "TOMORROW'S 2PM CUTOFF IN:" };
      }
    };

    const updateTimer = () => {
      const data = calculateTimeLeft();
      if (!data || data.diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        d: Math.floor(data.diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((data.diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((data.diff / 1000 / 60) % 60),
        s: Math.floor((data.diff / 1000) % 60),
        label: data.label,
      });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) return null;

  return (
    <span className="inline-flex items-center gap-1 ml-1.5 bg-[#FFD700]/20 text-[#FFD700] px-1.5 py-0.5 rounded border border-[#FFD700]/30 shadow-sm whitespace-nowrap">
      <span className="uppercase text-[8px] font-bold">{timeLeft.label}</span>
      <span className="tracking-widest font-mono text-[9px] font-semibold">
        {timeLeft.d > 0 && `${timeLeft.d}d `}{String(timeLeft.h).padStart(2, "0")}h {String(timeLeft.m).padStart(2, "0")}m {String(timeLeft.s).padStart(2, "0")}s
      </span>
    </span>
  );
};

export default function TopAnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const announcements: Array<{ icon: JSX.Element; text: string; link?: string; linkText?: string; countdownTo?: string }> = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd" viewBox="0 0 512 289.28" className="h-4 w-auto fill-[#FFD700]">
          <path d="M429.38 196.01c-25.83 0-46.64 20.95-46.64 46.63 0 25.83 20.95 46.64 46.64 46.64 25.83 0 46.63-20.95 46.63-46.64 0-25.82-20.95-46.63-46.63-46.63zm-382.92-26.2v-37.57h15.66c6.3 0 10.63 1.44 12.98 4.33 2.35 2.88 3.53 7.7 3.53 14.46 0 6.75-1.18 11.57-3.53 14.45-2.35 2.89-6.68 4.33-12.98 4.33H46.46zm15.83-27.95h-4.64v18.33h4.64c1.53 0 2.64-.19 3.33-.57.69-.38 1.04-1.25 1.04-2.61v-11.97c0-1.36-.35-2.23-1.04-2.61-.69-.38-1.8-.57-3.33-.57zm43.47 13.76H94.57v4.57h13.7v9.62H83.38v-37.57h24.61l-1.4 9.62H94.57v5.05h11.19v8.71zm30.48 14.19h-22.37v-37.57h11.18v27.95h11.19v9.62zm3.92 0v-37.57h11.18v37.57h-11.18zm36.69-37.57h11.8l-8.67 37.57h-16.33l-8.67-37.57h11.8l4.76 23.86h.5l4.81-23.86zm37.82 23.38h-11.19v4.57h13.7v9.62h-24.89v-37.57h24.61l-1.4 9.62h-12.02v5.05h11.19v8.71zm38.59 14.19h-12.31l-4.58-11.18h-2.41v11.18h-11.18v-37.57h17.62c8.01 0 12.02 4.39 12.02 13.17 0 6.01-1.73 9.97-5.2 11.9l6.04 12.5zm-19.3-27.95v7.51h2.58c1.34 0 2.32-.15 2.93-.45.62-.3.93-.99.93-2.07v-2.47c0-1.08-.31-1.77-.93-2.07-.61-.3-1.59-.45-2.93-.45h-2.58zm33.62-9.62l3.08 13.23h.39l3.13-13.23h12.37l-10.08 27.35v10.22h-11.18v-10.22l-10.07-27.35h12.36zM101.82 88.72H85.16v22.73h-19.6V50.2h40.18l-2.45 15.68H85.16v8.23h16.66v14.61zm63.21 22.73h-21.56l-8.04-18.23h-4.21v18.23h-19.6V50.2h30.87c14.04 0 21.07 7.16 21.07 21.46 0 9.8-3.04 16.27-9.12 19.41l10.59 20.38zm-33.81-45.57v12.25h4.5c2.36 0 4.07-.24 5.15-.73s1.62-1.62 1.62-3.38V70c0-1.77-.54-2.9-1.62-3.38-1.08-.49-2.79-.74-5.15-.74h-4.5zm79.87 22.44h-19.6v7.45h24.01v15.68h-43.61V50.2h43.12l-2.45 15.68h-21.07v8.23h19.6v14.21zm51.94 0h-19.6v7.45h24.01v15.68h-43.61V50.2h43.12l-2.45 15.68h-21.07v8.23h19.6v14.21zm136.5-15.43l-70.02-.42v-42.7c0-8.97-.6-15.44-7.46-22.31C317.46 2.87 311.14 0 304.11 0H25.25C18.22 0 11.91 2.87 7.32 7.46-.19 14.97 0 21.18 0 30.15v198.72c0 6.89 2.87 13.49 7.46 18.22 4.59 4.74 10.91 7.75 17.94 7.75h94.26c3.88 0 6.89-3.16 6.89-6.89 0-3.87-3.16-6.88-6.89-6.88l-94.26.14c-3.16 0-5.88-1.44-8.04-3.59-2.15-2.29-3.58-5.45-3.58-8.75V23.58c.39-2.47 1.56-4.74 3.3-6.36 2.15-2.15 5.02-3.44 8.17-3.44h278.86c3.16 0 6.03 1.29 8.18 3.44 4.05 4.06 3.44 8.14 3.44 13.28v210.57h-54.3c-3.87 0-6.89 3.01-6.89 6.88 0 3.73 3.02 6.89 6.89 6.89h61.19c3.87 0 6.89-3.01 6.89-6.89v-7.89h41.61c3.16-71.74 106.04-81.64 116.51 0h22.68c2.99-15.9 1.87-34.53-2.27-54.98-4.84-23.9-3.42-19.26-25.73-27.81l-45.51-20.38-37.27-64zm-17.94 19.66l-34.72-.43v44.77h58.26l-23.54-44.34zm-191.9 103.46c-25.83 0-46.64 20.95-46.64 46.63 0 25.83 20.95 46.64 46.64 46.64 25.83 0 46.63-20.95 46.63-46.64 0-25.82-20.95-46.63-46.63-46.63zm0 28.7c-9.9 0-17.94 8.03-17.94 17.93 0 9.91 8.04 17.94 17.94 17.94 9.9 0 17.93-8.03 17.93-17.94 0-9.9-8.03-17.93-17.93-17.93zm239.69 0c-9.9 0-17.94 8.03-17.94 17.93 0 9.91 8.04 17.94 17.94 17.94 9.9 0 17.93-8.03 17.93-17.94 0-9.9-8.03-17.93-17.93-17.93z"/>
        </svg>
      ),
      text: "Free Delivery for orders above ₦25,000",
      countdownTo: BONUS_CONFIG.PROMO_FREE_DELIVERY_2PM.end_date,
    },
    // {
    //   icon: <Gift className="w-4 h-4 text-[#F0800F]" />,
    //   text: "Refer a friend & get ₦2,000 off your next order!",
    //   link: "/account/referral",
    //   linkText: "Learn More",
    // },
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
  }, [announcements.length]);

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
              {announcements[currentIndex].countdownTo && (
                <CountdownDisplay />
              )}
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
