import { Metadata } from "next";
import { redirect } from "next/navigation";

import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import CredentialsSignUpForm from "./signup-form";
import { getUser } from "src/lib/actions/auth.actions";
import { PreloadResource } from "../preload-resources";

export const metadata: Metadata = {
  title: "Create Account",
};

export default async function SignUpPage(props: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { callbackUrl } = searchParams;

  const user = await getUser();
  if (user) {
    return redirect(callbackUrl);
  }

  return (
    <main className="h-screen flex">
      {/* Right Section (Image) */}
      <PreloadResource />

      {/* Left Section (Signup Form) */}
      <div className="flex md:w-[60%] lg:w-[40%] w-full flex-col justify-center px-4 md:px-8 !pt-10 pb-10 overflow-y-auto ml-auto">
        <div className="pb-6">
          <div className="flex flex-col gap-7 pt-16">
            <Link href="/">
              <Image src="/footerLogo.png" alt="logo" width={200} height={52} />
            </Link>
            <div className="flex flex-col gap-3">
              <p className="h2-bold text-3xl text-[#1B6013]">
                Log in to your account
              </p>
              <p className="font-semibold text-lg">
                Have an account?
                <Link
                  href={`/login?callbackUrl=${callbackUrl}`}
                  className="text-blue-600 ml-1 relative group"
                >
                  <span>Log in now</span>
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
        <CredentialsSignUpForm />
      </div>
    </main>
  );
}
