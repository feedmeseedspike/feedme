"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import Image from "next/image";

interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber,
  message,
}) => {
  const whatsappLink = `https://wa.me/${phoneNumber}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[80px] md:bottom-4 right-4 z-50 bg-[#1B6013]/90 text-white p-4 rounded-full shadow-lg hover:bg-[#1B6013]transition-colors flex items-center justify-center"
      aria-label="Chat on WhatsApp"
    >
      <Image src={"/whatsapp.svg"} width={35} height={35} alt="whatsapp" />
    </a>
  );
};

export default WhatsAppButton;
