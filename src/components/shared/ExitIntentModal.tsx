"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { X, Gift, Mail } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(1, "Please enter your name")
});

type EmailFormData = z.infer<typeof emailSchema>;

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExitIntentModal({ isOpen, onClose }: ExitIntentModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [discountCode, setDiscountCode] = useState("");

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      name: ""
    }
  });

  const onSubmit = async (data: EmailFormData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/email/exit-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        setDiscountCode(result.discountCode);
        setSuccess(true);
        
        // Mark as shown in localStorage
        localStorage.setItem("feedme_exit_modal_shown", "true");
        localStorage.setItem("feedme_discount_code", result.discountCode);
        
        // Auto close after 8 seconds
        setTimeout(() => {
          onClose();
        }, 8000);
      } else {
        throw new Error(result.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Error capturing email:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Mark as dismissed to prevent showing again today
    localStorage.setItem("feedme_exit_modal_dismissed", Date.now().toString());
    onClose();
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 px-6 pt-8 pb-6 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6 }}
              className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center"
            >
              <Gift className="w-10 h-10 text-green-500" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold mb-2"
            >
              Check Your Email! 📧
            </motion.h2>
          </div>

          <div className="px-6 py-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-gray-600 mb-4">
                We&apos;ve sent your <strong>5% discount code</strong> to your email!
              </p>
              
              <div className="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-4 mb-4">
                <p className="text-green-700 text-sm mb-2">Your discount code:</p>
                <div className="bg-white px-4 py-2 rounded-lg border-2 border-green-400 font-mono text-lg font-bold text-green-800">
                  {discountCode}
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Valid for 7 days • Use at checkout
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Start shopping now with fresh, quality produce delivered in 3 hours!
              </p>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 px-6 pt-8 pb-6 text-white text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-2">
              Wait! Don&apos;t leave empty-handed 🛒
            </h2>
            <p className="text-white/90 text-sm">
              Get fresh produce delivered to your door
            </p>
          </motion.div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-6"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Gift className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Get 5% OFF Your First Order!
              </h3>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              Join thousands of customers enjoying fresh, farm-to-table produce delivered in just 3 hours.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div>
              <Input
                placeholder="Enter your name"
                {...form.register("name")}
                className="w-full rounded-xl border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                disabled={loading}
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Input
                type="email"
                placeholder="Enter your email address"
                {...form.register("email")}
                className="w-full rounded-xl border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                disabled={loading}
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {loading ? "Sending..." : "Get My 5% Discount"}
            </Button>

            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <span>✅ Farm fresh quality</span>
              <span>•</span>
              <span>✅ 4-hour delivery</span>
              <span>•</span>
              <span>✅ No spam</span>
            </div>
          </motion.form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExitIntentModal;