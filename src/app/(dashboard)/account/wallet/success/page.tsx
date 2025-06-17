"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseSession } from "@components/supabase-auth-provider";
import { useToast } from "src/hooks/useToast";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function WalletSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSupabaseSession();
  const { showToast } = useToast();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full"
      >
        <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Success</h1>
        <p className="text-gray-700 mb-1">Verifying your payment...</p>
        <p className="text-sm text-gray-500">You will be redirected shortly.</p>
      </motion.div>
    </div>
  );
}
