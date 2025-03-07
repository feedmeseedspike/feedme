"use client";
import { redirect, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Loader2 } from "lucide-react"; 
// import { useToast } from "@components/hooks/use-toast"
import { ToastAction } from "@components/ui/toast"
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
import { signInUser } from "src/lib/actions/auth.actions";
import { useToast } from "src/hooks/use-toast";

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
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [loading, setLoading] = useState(false);
  const { toast } = useToast()

  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: signInDefaultValues,
  });

  const { control, handleSubmit } = form;

  const onSubmit = async (data: IUserSignIn) => {
    setLoading(true);
    try {
      const user = await signInUser({
        email: data.email,
        password: data.password,
      });
      // if(user.success === true){
      //   toast({
      //     variant: "destructive",
      //     title: "Uh oh! Something went wrong.",
      //     description: "There was a problem with your request.",
      //     action: <ToastAction altText="Try again">Try again</ToastAction>,
      //   })
        // return;
      // }
      console.log(user);
      redirect(callbackUrl);
    } catch (error) {
      console.log(error)
      if (isRedirectError(error)) {
        throw error;
      }
      // Handle error (e.g., show toast)
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
                  <Input
                    className="py-6 ring-1 ring-zinc-400"
                    type="password"
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
              Sign In
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
