"use client";

import { useToast } from "src/hooks/useToast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // console.log("ToastProvider mounted");
  // const { ToastContainer } = useToast();
  return (
    <>
      {/* <ToastContainer /> */}
      {children}
    </>
  );
}
