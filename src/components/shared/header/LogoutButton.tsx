"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOutUser } from "src/lib/actions/auth.actions";

interface LogoutButtonProps {
  showText?: boolean;
}

const LogoutButton = ({ showText = true }: LogoutButtonProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="cursor-pointer flex items-center gap-2 w-fit text-left px-2 pb-2"
    >
      <LogOut className="w-5 h-5 " />
      {showText && <span>Logout</span>}
    </button>
  );
};

export default LogoutButton;
