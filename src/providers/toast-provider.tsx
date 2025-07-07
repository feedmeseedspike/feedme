"use client";

import { useToast } from "src/hooks/useToast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // const { ToastContainer } = useToast();
  return (
    <>
      {/* <ToastContainer /> */}
      {children}
    </>
  );
}
