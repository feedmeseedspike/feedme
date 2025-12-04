"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import ChatWidget from "@components/shared/ChatWidget";

export interface WhatsAppButtonProps {
  phoneNumber?: string; // If not set, use env
  message?: string;
  cartSummary?: Array<{ name: string; qty: number; price?: number }>;
  className?: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber,
  message,
  cartSummary,
  className,
}) => {
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useState(false);

  const handleToggleChat = () => {
    setIsChatWidgetOpen((prev) => !prev);
  };

  return (
    <>
      <motion.button
        onClick={handleToggleChat}
        className={
          className ??
          `fixed bottom-[80px] md:bottom-4 right-4 z-50 bg-[#1B6013]/90 text-white shadow-lg hover:bg-[#1B6013] transition-all flex items-center justify-center gap-2 overflow-hidden ${
            isChatWidgetOpen
              ? "px-12 py-3	 rounded-full"
              : "p-2 px-4 rounded-full"
          }`
        }
        aria-label="Chat on WhatsApp"
        animate={{
          borderRadius: "9999px",
          paddingLeft: isChatWidgetOpen ? "12px" : "16px",
          paddingRight: isChatWidgetOpen ? "12px" : "16px",
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
          paddingLeft: { duration: 0.25 },
          paddingRight: { duration: 0.25 },
        }}
      >
        <Image
          src={"/whatsapp.svg"}
          width={60}
          height={60}
          alt="whatsapp"
          className="w-6 h-6 md:w-[30px] md:h-[30px] flex-shrink-0"
        />
        <AnimatePresence mode="wait">
          {!isChatWidgetOpen && (
            <motion.p
              key="text"
              initial={{ opacity: 1, x: 0, width: "auto" }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: -20, width: 0 }}
              transition={{
                duration: 0.25,
                ease: [0.4, 0, 0.2, 1],
                width: { duration: 0.3 },
              }}
              className="text-xs md:text-sm font-semibold whitespace-nowrap overflow-hidden"
            >
              Chat with us
            </motion.p>
          )}
        </AnimatePresence>
      </motion.button>

      <ChatWidget
        phoneNumber={phoneNumber}
        message={message}
        cartSummary={cartSummary}
        isOpen={isChatWidgetOpen}
        onClose={() => setIsChatWidgetOpen(false)}
      />
    </>
  );
};

export default WhatsAppButton;
