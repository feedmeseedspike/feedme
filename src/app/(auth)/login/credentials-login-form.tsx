"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { useForm } from "react-hook-form";
import { IUserSignIn } from "../../../types/index";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserSignInSchema } from "../../../lib/validator";
import { isRedirectError } from "next/dist/client/components/redirect";
import Link from "next/link";
import { useToast } from "src/hooks/useToast";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signInMutation } from "src/queries/auth";

const signInDefaultValues =
  process.env.NODE_ENV === "development"
    ? {
        email: "admin@example.com",
        password: "123456",
      }
    : {
        email: "",
        password: "",
      };

export default function CredentialsSignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const justSignedUp = searchParams?.get("justSignedUp");
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: signInDefaultValues,
  });

  const { control, handleSubmit } = form;

  const { mutateAsync, status } = useMutation(signInMutation());

  const onSubmit = async (data: IUserSignIn) => {
    try {
      await mutateAsync({
        email: data.email,
        password: data.password,
      });
      showToast("Successfully signed in!", "success");
      window.location.href = callbackUrl;
    } catch (error: any) {
      if (isRedirectError(error)) {
        throw error;
      }
      showToast(
        error?.message || "An unexpected error occurred during sign in.",
        "error"
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-6">
          {justSignedUp && (
            <div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Welcome!</strong>
              <span className="block sm:inline ml-2">
                Your account was created successfully. Please log in to
                continue.
              </span>
            </div>
          )}
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="font-semibold ring-zinc-400">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input className="py-6 ring-1 ring-zinc-400" {...field} />
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
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      className="py-6 ring-1 ring-zinc-400 pr-10"
                      type={showPassword ? "text" : "password"}
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-zinc-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-zinc-400" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="w-full pt-4">
            <Button
              className="w-full py-4 text-base bg-[#E0E0E0] text-zinc-600 ring-1 ring-zinc-400 font-semibold hover:bg-[#1B6013] transition-all ease-in-out hover:text-white hover:duration-500 flex items-center justify-center gap-2"
              type="submit"
              disabled={status === "pending"}
            >
              {status === "pending" && (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
              Sign In
            </Button>
          </div>
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
      </form>
    </Form>
  );
}
