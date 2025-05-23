"use client";
import { useCartMergeOnLogin } from "src/hooks/useCartMergeOnLogin";
import { useUser } from "src/hooks/useUser";

export default function CartMergeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = useUser();
  useCartMergeOnLogin(user);

  console.log("CartMergeProvider", user);

  return <>{children}</>;
}