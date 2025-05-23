"use client";

import { motion, AnimatePresence } from "framer-motion";
import { createContext, useState, useContext } from "react";
import Toast from "@components/shared/Toast";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  duration: number | undefined;
  id: string;
  message: string;
  type: ToastType;
}

// Toast Context
const ToastContext = createContext({
  showToast: (message: string, type?: ToastType) => {},
  dismissToast: (id: string) => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info", duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed top-0 right-4 z-[9999] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={dismissToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

