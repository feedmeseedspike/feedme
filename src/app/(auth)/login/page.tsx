import React from "react";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import CredentialsSignInForm from "src/app/(auth)/login/credentials-login-form";
import Link from "next/link";
import { getUser } from "src/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { PreloadResource, ReviewSlide } from "../preload-resources";
import { signinWithGoogle } from "@utils/google-action";
import GoogleButton from "src/components/GoogleButton";

export const metadata = { title: "Sign In" };

const reviews: ReviewSlide[] = [
  {
    imgSrc: "/loginBanner.jpeg",
    review:
      "I got the fruits. Thanks. The beef is good also. I'm satisfied. 👍🏽👍🏽👍🏽",
    customer: "Mrs Ayodeji Tijani",
  },
  {
    imgSrc: "/loginBanner.jpeg",
    review:
      "Yes ooo! Thanks so much. Please you people should keep it up o. Don't let the naija factor make you drop your standards. God bless!",
    customer: "Hannah Yavala",
  },
  {
    imgSrc: "/loginBanner.jpeg",
    review:
      "I received my order and everything was perfect! At first, I thought it might be a scam, but when my items arrived I was so surprised and amazed. Thank you for the extra carrot! Keep up the good work. Wow!",
    customer: "Nkiruka Okonkwo",
  },
  {
    imgSrc: "/loginBanner.jpeg",
    review:
      "I received my items in perfect condition and right on time. Thank you FeedMe for the great service!",
    customer: "Unuigbe Ugha",
  },
];

const Signin = async (props: {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}) => {
  const searchParams = await props.searchParams;
  const callbackUrl = searchParams.callbackUrl || "/";

  const user = await getUser();
  if (user) {
    return redirect(callbackUrl);
  }

  // // console.log(user, callbackUrl)

  return (
    <main className="h-screen flex gap-6">
      <div className="flex md:w-[60%] lg:w-[40%] w-full flex-col justify-center px-4 md:px-8">
        <div className="pb-6">
          <div className="flex flex-col gap-7">
            <Link href="/">
              <Image src="/footerLogo.png" alt="logo" width={200} height={52} />
            </Link>
            <div className="flex flex-col gap-3">
              <p className="h2-bold text-3xl text-[#1B6013]">
                Log in to your account
              </p>
              <p className="font-semibold text-lg">
                Don&apos;t have an account?
                <Link
                  href={`/register?callbackUrl=${encodeURIComponent(
                    callbackUrl
                  )}`}
                  className="text-blue-600 ml-1 relative group"
                >
                  <span>Sign Up</span>
                  <span className="absolute -bottom-[2px] left-1/2 w-0 h-[2px] bg-blue-600 group-hover:w-1/2 group-hover:transition-all"></span>
                  <span className="absolute -bottom-[2px] right-1/2 w-0 h-[2px] bg-blue-600 group-hover:w-1/2 group-hover:transition-all"></span>
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <GoogleButton />
          <div className="flex items-center gap-2">
            <span className="bg-[#EEF2FF] h-[2px] w-full"></span>
            <p className="whitespace-nowrap text-xs">
              or with email and password
            </p>
            <span className="bg-[#EEF2FF] h-[2px] w-full"></span>
          </div>
        </div>

        {/* Credentials Form */}
        <CredentialsSignInForm />
      </div>

      {/* Right Section (Image) */}
      <div className="hidden md:flex md:w-[40%] lg:w-[60%] h-screen">
        <PreloadResource slides={reviews} />
      </div>
    </main>
  );
};

export default Signin;
