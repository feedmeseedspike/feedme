import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getUser } from "src/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { PreloadResource } from "../preload-resources";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata = { title: "Forgot Password" };

const ForgotPassword = async (props: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) => {
  const searchParams = await props.searchParams;
  const { callbackUrl = "/" } = searchParams;

  const user = await getUser();
  if (user) {
    return redirect(callbackUrl);
  }

  return (
    <main className="h-screen flex gap-6">
      <div className="flex md:w-[60%] lg:w-[40%] w-full flex-col justify-center px-4 md:px-8">
        <div className="pb-6">
          <div className="flex flex-col gap-7">
            <PreloadResource />
            <div className="flex flex-col gap-3">
              <p className="h2-bold text-3xl text-[#1B6013]">
                Reset your password
              </p>
              <p className="font-semibold text-lg">
                Remember your password?
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                  className="text-blue-600 ml-1 relative group"
                >
                  <span>Sign In</span>
                  <span className="absolute -bottom-[2px] left-1/2 w-0 h-[2px] bg-blue-600 group-hover:w-1/2 group-hover:transition-all"></span>
                  <span className="absolute -bottom-[2px] right-1/2 w-0 h-[2px] bg-blue-600 group-hover:w-1/2 group-hover:transition-all"></span>
                </Link>
              </p>
            </div>
          </div>
        </div>

        <ForgotPasswordForm />
      </div>

      {/* Right Section (Image) */}
      <div className="hidden md:flex md:w-[40%] lg:w-[60%]">
        <Image
          src="/loginBanner.jpeg"
          width={900}
          height={900}
          alt="loginbanner"
          className="w-full h-full object-cover"
        />
      </div>
    </main>
  );
};

export default ForgotPassword;