"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signOutUser, resetPassword } from "src/lib/actions/auth.actions";
import { useToast } from "src/hooks/useToast";
import { useState } from "react";

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

declare global {
  interface Window {
    supabase: any;
  }
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = form;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated
    // (You may want to keep this or handle with middleware)
  }, [router]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);
    const result = await resetPassword(data.password);
    if (!result.success) {
      const errorMsg =
        typeof result.error === "string" ? result.error : result.error?.message;
      showToast(errorMsg || "Failed to reset password.", "error");
    } else {
      showToast("Password reset successful! Please log in.", "success");
      await signOutUser();
      router.push("/login?reset=success");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 md:p-10 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-[#1B6013]">
            Reset Your Password
          </h1>
          <p className="text-gray-600 text-center">
            Enter your new password below.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#1B6013] mb-1">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter your new password"
              {...register("password")}
              className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#1B6013] focus:outline-none"
            />
            {errors.password && (
              <div className="text-xs text-rose-500 mt-1">
                {errors.password.message}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1B6013] mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm your new password"
              {...register("confirm")}
              className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#1B6013] focus:outline-none"
            />
            {errors.confirm && (
              <div className="text-xs text-rose-500 mt-1">
                {errors.confirm.message}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 mt-2 bg-[#1B6013]/90 text-white font-semibold rounded-lg hover:bg-[#1B6013] transition-colors"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                Resetting...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
