"use client";

import { useState } from "react";
import { Megaphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AnnouncementBannerClient({ message }: { message: string }) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0, y: -20 }}
          animate={{ height: "auto", opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -20 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className="relative w-full bg-[#F0800F] text-white shadow-lg z-40"
        >
          <div className="flex items-center justify-center px-4 py-3 relative max-w-7xl mx-auto">
             
             {/* Animated Megaphone */}
             <motion.div
                animate={{ 
                  rotate: [0, -15, 15, -15, 15, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                    duration: 2.5, 
                    ease: "easeInOut",
                    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                    repeat: Infinity, 
                    repeatDelay: 5
                }}
                className="hidden md:block mr-3"
             >
                <Megaphone className="w-6 h-6 fill-white/20 drop-shadow-sm" />
             </motion.div>

             {/* Message */}
             <div className="text-center font-semibold tracking-wide text-sm md:text-base leading-tight drop-shadow-sm">
                 <Megaphone className="w-4 h-4 inline-block mr-2 md:hidden" />
                 {message}
             </div>

             {/* Close Button */}
             <button 
               onClick={() => setIsVisible(false)}
               className="absolute right-2 md:right-4 p-1.5 hover:bg-white/20 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
               aria-label="Dismiss announcement"
             >
               <X className="w-4 h-4 opacity-90" />
             </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
