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
import { useToast } from "src/hooks/use-toast";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      // TODO: Implement your password reset logic here
      // await sendPasswordResetEmail(data.email);
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
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
              className="w-full py-4 text-base bg-[#E0E0E0] text-zinc-600 ring-1 ring-zinc-400 font-semibold hover:bg-[#1B6013] transition-all ease-in-out hover:text-white hover:duration-500 flex items-center justify-center gap-2"
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Send Reset Link
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}