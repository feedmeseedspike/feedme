import { Metadata } from "next";
import { redirect } from "next/navigation";

import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import CredentialsSignUpForm from "./signup-form";
import { getUser } from "src/lib/actions/auth.actions";
import { PreloadResource, ReviewSlide } from "../preload-resources";
import { signinWithGoogle } from "@utils/google-action";
import React from "react";
import GoogleButton from "src/components/GoogleButton";

export const metadata: Metadata = {
  title: "Create Account",
};

const reviews: ReviewSlide[] = [
  {
    imgSrc: "/loginBanner.jpeg",
    review:
      "Absolutely love this store! Fast shipping and the products are top quality. Will shop again!",
    customer: "Emily R.",
  },
  {
    imgSrc: "/loginBanner.jpeg",
    review:
      "Customer service was so helpful and my order arrived earlier than expected. Highly recommend!",
    customer: "James T.",
  },
  {
    imgSrc: "/loginBanner.jpeg",
    review:
      "Great selection and amazing prices. The checkout process was super easy, too!",
    customer: "Priya S.",
  },
];

export default async function SignUpPage(props: {
  searchParams: Promise<{
    callbackUrl?: string;
    referral_code?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { callbackUrl, referral_code } = searchParams;

  const user = await getUser();
  if (user) {
    return redirect(callbackUrl || "/");
  }

  return (
    <main className="h-screen flex gap-6">
      <div className="flex md:w-[60%] lg:w-[40%] w-full flex-col justify-cente px-4 md:px-8 h-screen overflow-y-auto py-6">
        <div className="px- pt-8 pb-4">
          <Link href="/">
            <Image src="/footerLogo.png" alt="logo" width={200} height={52} />
          </Link>
          <div className="flex flex-col gap-3 mt-4">
            <p className="h2-bold text-3xl text-[#1B6013]">
              Create your account
            </p>
            <p className="font-semibold text-lg">
              Have an account?
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(
                  callbackUrl || "/"
                )}`}
                className="text-blue-600 ml-1 relative group"
              >
                <span>Log in now</span>
                <span className="absolute -bottom-[2px] left-1/2 w-0 h-[2px] bg-blue-600 group-hover:w-1/2 group-hover:transition-all"></span>
                <span className="absolute -bottom-[2px] right-1/2 w-0 h-[2px] bg-blue-600 group-hover:w-1/2 group-hover:transition-all"></span>
              </Link>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Google Sign-In Button (client-side) */}
          <GoogleButton referralCode={referral_code} />
          <div className="flex items-center gap-2">
            <span className="bg-[#EEF2FF] h-[2px] w-full"></span>
            <p className="whitespace-nowrap text-xs">
              or with email and password
            </p>
            <span className="bg-[#EEF2FF] h-[2px] w-full"></span>
          </div>
        </div>

        {/* Credentials Form */}
        <CredentialsSignUpForm />
      </div>

      {/* Right Section (Image) */}
      <div className="hidden md:flex md:w-[40%] lg:w-[60%] sticky top-0 h-screen">
        <PreloadResource slides={reviews} />
      </div>
    </main>
  );
}
