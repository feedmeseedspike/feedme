"use client";
import { useEffect } from "react";
import { useUser } from "src/hooks/useUser";

export default function CartMergeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = useUser();

  return <>{children}</>;
}
