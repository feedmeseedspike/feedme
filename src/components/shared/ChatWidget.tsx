"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ChatWidgetProps {
  phoneNumber?: string;
  message?: string;
  cartSummary?: Array<{ name: string; qty: number; price?: number }>;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatWidget({
  phoneNumber,
  message,
  cartSummary,
  isOpen,
  onClose,
}: ChatWidgetProps) {
  const phone = phoneNumber ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

  let waText = message ?? "";
  if (!waText && cartSummary && cartSummary.length > 0) {
    waText =
      "Hello! I want to order:\n" +
      cartSummary
        .map(
          (item) =>
            `- ${item.name} x${item.qty}${item.price ? ` (₦${item.price})` : ""}`
        )
        .join("\n");
  }

  const whatsappLink = `https://wa.me/${phone}${waText ? `?text=${encodeURIComponent(waText)}` : ""}`;

  const handleStartChat = () => {
    window.open(whatsappLink, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed bottom-[140px] md:bottom-20 right-4 z-[85] w-[320px] sm:w-[360px] min-h-[280px] bg-[url('/images/whatsapp-background.jpg')] bg-cover bg-center rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 400,
            mass: 0.5,
          }}
        >
          {/* Background overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full min-h-[280px]">
            {/* Header */}
            <div className="bg-[#1B6013]/95 backdrop-blur-sm px-4 py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center p-1.5">
                  <Image
                    src={"/Footerlogo.png"}
                    width={30}
                    height={30}
                    alt="FeedMe Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-base leading-tight">
                    FeedMe
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                    <span className="text-white/90 text-xs font-medium">
                      online
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1.5 ml-2 flex-shrink-0"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message */}
            <div className="px-4 pt-4 flex items-start">
              <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-lg max-w-[85%]">
                {/* Chat bubble tail pointing left */}
                <div className="absolute -left-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-white/95 border-b-[8px] border-b-transparent" />
                <p className="text-gray-800 text-sm leading-relaxed">
                  Hi, How can I help you?
                </p>
              </div>
            </div>

            {/* Start Chat Button - Fixed at bottom */}
            <div className="px-4 pb-5 mt-auto flex-shrink-0">
              <button
                onClick={handleStartChat}
                className="w-full bg-[#1B6013] hover:bg-[#15500f] active:bg-[#12400c] text-white font-semibold py-2 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <span className="text-base">Start chat</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
