"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = form;

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);
    try {
      // Example:
      // const res = await fetch("/api/reset-password", { ... })
      // ...
      showToast("Password reset successful! You can now log in.", "success");
      form.reset();
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      showToast(
        "Failed to reset password: " + (err.message || "Unknown error"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Reset Your Password</h1>
      <p className="text-gray-600 mb-6">Enter your new password below.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter your new password"
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <div className="text-sm text-rose-500">{errors.password.message}</div>
        )}
        <div className="relative">
          <Input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm your new password"
            {...register("confirm")}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            onClick={() => setShowConfirm((s) => !s)}
            tabIndex={-1}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.confirm && (
          <div className="text-sm text-rose-500">{errors.confirm.message}</div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="w-5 h-5 animate-spin" />} Reset
          Password
        </Button>
      </form>
    </div>
  );
}
