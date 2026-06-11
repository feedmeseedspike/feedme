"use client";

import { createContext, useContext, useEffect, useCallback } from "react";
import { toast as sonnerToast, Toaster } from "sonner";
import Image from "next/image";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastContextValue {
  toasts: any[];
  showToast: (
    message: string,
    type?: ToastVariant,
    duration?: number,
    options?: { imageUrl?: string; title?: string }
  ) => void;
  dismissToast: (id: string | number) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  showToast: () => {},
  dismissToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((
    message: string,
    type: ToastVariant = "info",
    duration = 5000,
    options?: { imageUrl?: string; title?: string }
  ) => {
    const t = type === 'warning' ? sonnerToast.warning : type === 'error' ? sonnerToast.error : type === 'success' ? sonnerToast.success : sonnerToast.info;
    
    if (options?.imageUrl) {
      sonnerToast(message, {
        description: options.title,
        duration,
        icon: (
          <div className="relative w-10 h-10 flex-shrink-0 mr-3">
            <Image src={options.imageUrl} alt="" fill className="rounded object-cover border" />
          </div>
        ),
      });
    } else {
      t(message, { description: options?.title, duration });
    }
  }, []);

  const dismissToast = useCallback((id: string | number) => {
    sonnerToast.dismiss(id);
  }, []);

  // Bridge for utils.showToast -> context via window event
  useEffect(() => {
    const handler = (e: any) => {
      const { message, type, imageUrl, title, duration } = e.detail || {};
      if (!message) return;
      showToast(message, type, duration, { imageUrl, title });
    };
    if (typeof window !== "undefined") {
      window.addEventListener("app-toast", handler as EventListener);
      return () =>
        window.removeEventListener("app-toast", handler as EventListener);
    }
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts: [], showToast, dismissToast }}>
      {children}
      <Toaster position="bottom-right" richColors closeButton theme="light" />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

