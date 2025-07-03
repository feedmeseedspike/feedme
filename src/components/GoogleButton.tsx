"use client";
import { FcGoogle } from "react-icons/fc";
import { signinWithGoogle } from "@utils/google-action";

export default function GoogleButton({
  referralCode,
}: {
  referralCode?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => signinWithGoogle(referralCode)}
      className="rounded-lg w-full py-3 flex justify-center ring-1 ring-zinc-500 shadow-sm"
    >
      <p className="flex gap-2 items-end">
        <FcGoogle className="text-2xl" />
        <span className="font-semibold text-md">Google</span>
      </p>
    </button>
  );
}
