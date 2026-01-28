"use client";
import React from "react";

import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gray-50">
      <div className="max-w-xl w-full space-y-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mx-auto w-20 h-20 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[#1B6013]/10 rounded-full blur-xl" />
          <Icon icon="solar:shield-warning-bold-duotone" className="w-12 h-12 text-[#1B6013] relative z-10" />
        </motion.div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">Something Went Wrong</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#1B6013] font-bold">Maintenance In Progress</p>
          </div>
          <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
            Our systems are experiencing a brief technical issue. We&apos;re working to resolve this as quickly as possible.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button
            onClick={reset}
            className="w-full sm:w-auto px-10 h-14 bg-[#1B6013] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#15490e] transition-all flex items-center justify-center gap-3 rounded-xl shadow-lg shadow-green-100"
          >
            <RefreshCcw size={14} />
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-10 h-14 border border-gray-200 bg-white text-gray-900 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3 rounded-xl shadow-sm"
          >
            <ArrowLeft size={14} />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
