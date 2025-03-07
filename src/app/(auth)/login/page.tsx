import React from "react";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import CredentialsSignInForm from "src/app/(auth)/login/credentials-login-form";
import Link from "next/link";
import { getUser } from "src/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { PreloadResource } from "../preload-resources";

export const metadata = { title: "Sign In" };

const Signin = async (props: {
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

  // console.log(user, callbackUrl)

  return (
    <main className="h-screen flex gap-6">
      <div className="flex md:w-[60%] lg:w-[40%] w-full flex-col justify-center px-4 md:px-8">
        <div className="pb-6">
          <div className="flex flex-col gap-7">
            <PreloadResource />
            {/* <Link href="/">
              <Image src="/footerLogo.png" alt="logo" width={200} height={52} />
            </Link> */}
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
          <button className="rounded-lg w-full py-3 flex justify-center ring-1 ring-zinc-500 shadow-sm">
            <p className="flex gap-2 items-end">
              <FcGoogle className="text-2xl" />
              <span className="font-semibold text-md">Google</span>
            </p>
          </button>
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
      <div className="hidden md:flex md:w-[40%] lg:w-[60%]">
        <Image
          src="/loginBanner.jpeg"
          width={900}
          height={900}
          alt="loginbanner"
          className="w-full h-full object-cove"
        />
      </div>
    </main>
  );
};

export default Signin;
