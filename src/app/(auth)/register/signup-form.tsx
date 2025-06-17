"use client";
import { redirect, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { useForm } from "react-hook-form";
import { IUserSignUp } from "../../../types/index";
import { useToast } from "src/hooks/useToast";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserSignUpSchema } from "../../../lib/validator";
import { Separator } from "@components/ui/separator";
import { isRedirectError } from "next/dist/client/components/redirect";
import { registerUser } from "src/lib/actions/auth.actions";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@utils/supabase/client";
import { useUser } from "src/hooks/useUser";

const signUpDefaultValues =
  process.env.NODE_ENV === "development"
    ? {
        name: "john doe",
        email: "john@me.com",
        password: "123456",
        confirmPassword: "123456",
      }
    : {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      };

export default function CredentialsSignUpForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlReferralCode = searchParams.get("referral_code");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();

  useEffect(() => {
    if (user && !isUserLoading) {
      const redirectUrl = urlReferralCode
        ? `/account?referral_code=${encodeURIComponent(urlReferralCode)}`
        : "/account";
      router.replace("/account/referral");
    }
  }, [user, isUserLoading, router, urlReferralCode]);

  const form = useForm<IUserSignUp>({
    resolver: zodResolver(UserSignUpSchema),
    defaultValues: {
      ...signUpDefaultValues,
      referralCode: urlReferralCode || "",
    },
  });

  const { control, handleSubmit, setValue } = form;

  const { showToast } = useToast();

  useEffect(() => {
    if (urlReferralCode) {
      localStorage.setItem("referral_code", urlReferralCode);
    }
  }, [urlReferralCode]);

  const applyReferral = async (
    referrerEmail: string,
    referredUserId: string
  ) => {
    try {
      const response = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrerEmail, referredUserId }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Failed to apply referral:", data.message);
        showToast(data.message || "Failed to apply referral", "error");
      } else {
        showToast(data.message || "Referral applied successfully!", "success");
      }
    } catch (error) {
      console.error("Error applying referral:", error);
      showToast(
        "An unexpected error occurred during referral application.",
        "error"
      );
    }
  };

  const onSubmit = async (data: IUserSignUp) => {
    setLoading(true);
    const { name, email, password, referralCode } = data;
    const supabase = createClient();

    try {
      // First check if user exists
      const {
        data: { user: existingUser },
        error: existingUserError,
      } = await supabase.auth.getUser();


      if (existingUser && !existingUserError) {
        showToast("User already exists. Please login instead.", "error");
        return router.push(
          `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        );
      }

      // Create the user
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

      if (signUpError) {
        console.error("Signup error:", signUpError);
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error("User creation failed - no user returned");
      }

      console.log("User created:", signUpData.user);

      if (referralCode || localStorage.getItem("referral_code")) {
        handleReferral(
          signUpData.user.id,
          referralCode,
          signUpData.user.email!
        ).catch((e) => console.error("Referral error:", e));
      }

      // Show success and redirect
      showToast("Registration successful!", "success");

      return router.push(
        `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      );
    } catch (error: any) {
      console.error("Signup failed:", error);
      showToast(
        error.message || "An error occurred during registration",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Separate function for referral handling
  const handleReferral = async (
    userId: string,
    referralCode?: string,
    referredUserEmail?: string
  ) => {
    const code = referralCode || localStorage.getItem("referral_code");
    if (!code || !referredUserEmail) return;

    try {
      const response = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referrerEmail: code,
          referredUserId: userId,
          referredUserEmail: referredUserEmail,
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      localStorage.removeItem("referral_code");
    } catch (error) {
      console.error("Referral failed - continuing without referral:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-6">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="font-semibold ring-zinc-400">
                  Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter name address"
                    {...field}
                    className="py-6 ring-1 ring-zinc-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="font-semibold ring-zinc-400">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter email address"
                    {...field}
                    className="py-6 ring-1 ring-zinc-400"
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
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      className="py-6 ring-1 ring-zinc-400 pr-10"
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

          <FormField
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="font-semibold ring-zinc-400">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      className="py-6 ring-1 ring-zinc-400 pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
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

          <FormField
            control={control}
            name="referralCode"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="font-semibold ring-zinc-400">
                  Referral Code (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter referrer's email if you have one"
                    {...field}
                    className="py-6 ring-1 ring-zinc-400"
                    readOnly={!!urlReferralCode}
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
              {loading ? "Signing Up..." : "Sign Up"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
