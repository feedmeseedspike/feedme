"use client";

import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast = ({ 
  id, 
  message, 
  type, 
  onClose, 
  duration = 3000
}: ToastProps) => {
  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colorMap = {
    success: "bg-white border-emerald-200 text-black",
    error: "bg-white border-rose-200 text-black",
    warning: "bg-white border-amber-200 text-black",
    info: "bg-white border-blue-200 text-black",
  };

  const iconColorMap = {
    success: "text-emerald-500",
    error: "text-rose-500",
    warning: "text-amber-500",
    info: "text-blue-500",
  };

  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (duration) {
      timerRef.current = setTimeout(() => {
        onClose(id);
      }, duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [id, duration, onClose]);

  return (
    <motion.div
      key={id} 
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
      transition={{ 
        type: "spring", 
        damping: 20, 
        stiffness: 300,
        restDelta: 0.1,
        restSpeed: 10
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colorMap[type]} shadow-lg max-w-xs pointer-events-auto relative top-[5.5rem]`}
    >
      <div className={`flex-shrink-0 ${iconColorMap[type]}`}>
        {iconMap[type]}
      </div>
      <div className="text-sm font-medium flex-1">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="ml-2 text-gray-400 hover:text-gray-500 transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default Toast;