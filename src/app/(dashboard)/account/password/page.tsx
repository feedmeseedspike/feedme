"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "src/hooks/useToast";
import { updatePassword } from "src/lib/actions/auth.actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import ErrorBoundary from "@components/shared/ErrorBoundary";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string(),
    showCurrentPassword: z.boolean().optional(),
    showNewPassword: z.boolean().optional(),
    showConfirmPassword: z.boolean().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function PasswordPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      setIsLoading(true);
      const result = await updatePassword(
        data.currentPassword,
        data.newPassword
      );

      if (result.success) {
        showToast("Password updated successfully", "success");
        form.reset();
      } else {
        const errorMsg =
          typeof result.error === "string"
            ? result.error
            : result.error.message;
        showToast(errorMsg || "Failed to update password", "error");
      }
    } catch (error: any) {
      showToast(error.message || "Failed to update password", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className=" py-4">
        <h1 className="text-2xl font-bold mb-4">Change Password</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={
                          form.watch("showCurrentPassword")
                            ? "text"
                            : "password"
                        }
                        {...field}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          form.setValue(
                            "showCurrentPassword",
                            !form.watch("showCurrentPassword")
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {form.watch("showCurrentPassword") ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={
                          form.watch("showNewPassword") ? "text" : "password"
                        }
                        {...field}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          form.setValue(
                            "showNewPassword",
                            !form.watch("showNewPassword")
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {form.watch("showNewPassword") ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={
                          form.watch("showConfirmPassword")
                            ? "text"
                            : "password"
                        }
                        {...field}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          form.setValue(
                            "showConfirmPassword",
                            !form.watch("showConfirmPassword")
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {form.watch("showConfirmPassword") ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Form>
      </div>
    </ErrorBoundary>
  );
}
