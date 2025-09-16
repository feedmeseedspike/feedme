"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Gift, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  discountCode: string;
  discountPercentage: number;
}

export function WelcomeModal({ 
  isOpen, 
  onClose, 
  customerName, 
  discountCode, 
  discountPercentage 
}: WelcomeModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy discount code:", err);
    }
  };

  const handleStartShopping = () => {
    onClose();
    window.location.href = '/';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 px-6 pt-8 pb-6 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center"
            >
              <Gift className="w-10 h-10 text-green-500" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold mb-2"
            >
              Welcome to FeedMe, {customerName}! 🎉
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-green-100 text-sm"
            >
              Thank you for joining our fresh produce community!
            </motion.p>
          </motion.div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🎁 Special Welcome Offer!
            </h3>
            <p className="text-gray-600 mb-4">
              Get <span className="font-bold text-green-600">{discountPercentage}% OFF</span> your first order
            </p>
            
            {/* Discount code display */}
            <div className="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-700 mb-2">Your discount code:</p>
              <div className="flex items-center justify-center gap-3">
                <div className="bg-white px-4 py-2 rounded-lg border-2 border-green-400 font-mono text-lg font-bold text-green-800">
                  {discountCode}
                </div>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-green-600 mt-2">
                Valid for 30 days • Use at checkout
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="space-y-3 mb-6"
          >
            <h4 className="font-semibold text-gray-800 text-sm">What makes us special:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Farm-fresh produce delivered in 3 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Quality guaranteed on every item</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Supporting local farmers</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="space-y-3"
          >
            <Button
              onClick={handleStartShopping}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Start Shopping Now
            </Button>
            
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-800"
            >
              I'll shop later
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WelcomeModal;