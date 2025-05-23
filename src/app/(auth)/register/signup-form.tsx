"use client";
import { redirect, useSearchParams } from "next/navigation";
import { useState } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<IUserSignUp>({
    resolver: zodResolver(UserSignUpSchema),
    defaultValues: signUpDefaultValues,
  });

  const { control, handleSubmit } = form;

  const { showToast } = useToast();

const onSubmit = async (data: IUserSignUp) => {
  const { name, email, password } = data;
  setLoading(true);
  try {
    const res = await registerUser({ name, email, password });
    console.log(res)
    
    if (!res.success) {
      showToast(res.error?.message || "Something went wrong", "error");
      return;
    }
    
    // OR Option 2: Show success message before redirecting to login
    showToast("Registration successful! Please login", "success");
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    // Show the actual error message if available
    showToast(error?.message || "Registration failed", "error");
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
