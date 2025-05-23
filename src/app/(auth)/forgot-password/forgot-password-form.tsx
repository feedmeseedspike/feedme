"use client";
import { useSearchParams, useRouter } from "next/navigation";
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
import { toast, Toaster } from "sonner";
import { requestPasswordReset } from "src/lib/actions/auth.actions";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { control, handleSubmit } = form;

  const onSubmit = async (data: z.infer<typeof ForgotPasswordSchema>) => {
    // // console.log(data);
    setLoading(true);
    try {
      const result = await requestPasswordReset(data.email, data.password);
      // // console.log(result);

      if (result.success) {
        toast.success("Password reset successful", {
          description:
            "Your password has been updated. Redirecting to sign in...",
        });

        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast.error("Error", {
          description:
            result.error || "Failed to reset password. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to reset password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster />
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

            <FormField
              control={control}
              name="password"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="font-semibold ring-zinc-400">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="py-6 ring-1 ring-zinc-400"
                      type="password"
                      placeholder="Enter your new password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="w-full pt-4">
              <Button
                className="w-full py-4 text-base bg-[#E0E0E0] text-zinc-600 ring-1 ring-zinc-400 font-semibold hover:bg-[#1B6013] transition-all ease-in-out hover:text-white hover:duration-500 flex items-center justify-center gap-2"
                type="submit"
                disabled={loading}
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Reset Password
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
