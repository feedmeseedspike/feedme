"use client";

import { motion, AnimatePresence } from "framer-motion";
import { createContext, useState, useContext, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  AlertTriangle,
} from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: string;
  message: string;
  type?: ToastVariant;
  duration?: number;
  imageUrl?: string;
  title?: string;
}

interface ToastProps {
  id: string;
  message: string;
  type?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
  imageUrl?: string;
  title?: string;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (
    message: string,
    type?: ToastVariant,
    duration?: number,
    options?: { imageUrl?: string; title?: string }
  ) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  showToast: () => {},
  dismissToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    message: string,
    type: ToastVariant = "info",
    duration = 5000,
    options?: { imageUrl?: string; title?: string }
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type,
        duration,
        imageUrl: options?.imageUrl,
        title: options?.title,
      },
    ]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Bridge for utils.showToast -> context via window event
  useEffect(() => {
    const handler = (e: any) => {
      const { message, type, imageUrl, title, duration } = e.detail || {};
      if (!message) return;
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [
        ...prev,
        { id, message, type, duration, imageUrl, title },
      ]);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("app-toast", handler as EventListener);
      return () =>
        window.removeEventListener("app-toast", handler as EventListener);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="pointer-events-auto"
            >
              <Toast
                id={toast.id}
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onClose={dismissToast}
                imageUrl={toast.imageUrl}
                title={toast.title}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const Toast = ({
  id,
  message,
  type = "info",
  onClose,
  duration = 5000,
  imageUrl,
  title,
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

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colorMap[type]} shadow-lg max-w-sm`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="w-10 h-10 rounded object-cover border"
        />
      ) : (
        <div className={`flex-shrink-0 ${iconColorMap[type]}`}>
          {iconMap[type]}
        </div>
      )}
      <div className="text-sm flex-1">
        {title && (
          <div className="font-semibold leading-tight mb-0.5">{title}</div>
        )}
        <div className="font-medium">{message}</div>
      </div>
      <button
        onClick={() => onClose(id)}
        className="ml-2 text-gray-400 hover:text-gray-500 transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const useToast = () => useContext(ToastContext);
