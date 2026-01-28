"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { ArrowLeft, RefreshCcw, AlertCircle } from "lucide-react";

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    console.error("Home route error:", error);
  }, [error]);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center bg-gray-50">
      <div className="max-w-xl w-full space-y-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto w-24 h-24 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[#1B6013]/10 rounded-full blur-2xl animate-pulse" />
          <Icon icon="solar:tea-cup-bold-duotone" className="w-16 h-16 text-[#1B6013] relative z-10" />
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2, duration: 0.8 }}
           className="space-y-6"
        >
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              A Brief Interruption
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#1B6013] font-bold">
              Service Unavailable
            </p>
          </div>

          <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed max-w-md mx-auto">
            We&apos;ve encountered a minor technical issue. Please refresh the page or return to the home screen to continue.
          </p>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4, duration: 0.8 }}
           className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
        >
          <button
            onClick={reset}
            className="w-full sm:w-auto px-10 h-14 bg-[#1B6013] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#15490e] transition-all flex items-center justify-center gap-3 rounded-xl shadow-lg shadow-green-100"
          >
            <RefreshCcw size={14} />
            Try Refreshing
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-10 h-14 border border-gray-200 bg-white text-gray-900 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3 rounded-xl shadow-sm"
          >
            <ArrowLeft size={14} />
            Return Home
          </Link>
        </motion.div>

        {/* Technical details hidden by default */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1, duration: 1 }}
           className="pt-12"
        >
          <button 
            onClick={() => setShowTechnical(!showTechnical)}
            className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-gray-400 transition-colors"
          >
            {showTechnical ? "- Hide technical details" : "+ View technical details"}
          </button>
          
          <AnimatePresence>
            {showTechnical && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm"
              >
                <p className="text-[10px] font-mono text-gray-400 break-all">
                  Reference ID: {error.digest || "N/A"}
                  <br />
                  Error: {error.message || "Unknown error"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

