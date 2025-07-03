"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/useToast";
import { requestPasswordReset } from "src/lib/actions/auth.actions";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { showToast } = useToast();

  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { control, handleSubmit } = form;

  const onSubmit = async (data: z.infer<typeof ForgotPasswordSchema>) => {
    setLoading(true);
    try {
      const result = await requestPasswordReset(data.email);
      console.log(result)
      if (result.success) {
        showToast(
          "If this email exists, you will receive a password reset link.",
          "success"
        );
        setEmailSent(true);
      } else {
        showToast(
          result.error || "Failed to send reset email. Please try again.",
          "error"
        );
      }
    } catch (error) {
      showToast("Failed to send reset email. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-6">
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="font-semibold ring-zinc-400">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    className="py-6 ring-1 ring-zinc-400"
                    placeholder="Enter your email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="w-full pt-4">
            <Button
              className="w-full py-4 text-base bg-[#1B6013] text-white ring-1 ring-[#1B6013] font-semibold hover:bg-[#1B6013]/90 transition-all ease-in-out hover:duration-500 flex items-center justify-center gap-2"
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Send Reset Link
            </Button>
          </div>

          {emailSent && (
            <div className="text-green-600 text-center pt-4">
              If this email exists, you will receive a password reset link.
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
