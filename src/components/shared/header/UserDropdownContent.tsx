import React from "react";
import Link from "next/link";
import { User as UserIcon, Package, Heart, Wallet, Truck } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { Separator } from "@components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";

interface UserDropdownContentProps {
  user: {
    display_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    role?: string | null;
  };
}

const UserDropdownContent: React.FC<UserDropdownContentProps> = ({ user }) => (
  <div className="w-64 bg-white p-4 shadow-xl rounded-xl flex flex-col">
    <div className="mb-4 pb-4 border-b border-gray-200 text-center">
      <Avatar className="mx-auto size-16 mb-2">
        <AvatarImage src={user?.avatar_url ?? undefined} />
        <AvatarFallback>{user?.display_name?.[0] || "U"}</AvatarFallback>
      </Avatar>
      <p className="font-semibold text-md mb-1 truncate">
        {user?.display_name || "User"}
      </p>
      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
    </div>
    <div className="flex-1 space-y-2">
      <Link
        href="/account/profile"
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors"
      >
        <UserIcon className="mr-2 h-4 w-4" /> Account Settings
      </Link>
      <Link
        href="/account/order"
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors"
      >
        <Package className="mr-2 h-4 w-4" /> My Orders
      </Link>
      <Link
        href="/track-order"
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors"
      >
        <Truck className="mr-2 h-4 w-4" /> Track Order
      </Link>
      <Link
        href="/account/wallet"
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors"
      >
        <Wallet className="mr-2 h-4 w-4" /> Wallet
      </Link>
      {/* SPIN TO WIN - TEMPORARILY DISABLED */}
      {/* <Link
        href="/spin-to-win"
        className="flex items-center gap-2 p-2 hover:bg-purple-50 text-purple-700 font-medium rounded transition-colors"
      >
        <div className="mr-2 h-4 w-4 flex items-center justify-center text-lg">🎡</div> Spin & Win
      </Link> */}
      {user && (user as any).role === "admin" && (
        <Link
          href="/admin/overview"
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <Package className="mr-2 h-4 w-4" /> Admin
        </Link>
      )}
      <Link
        href="/account/favourites"
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors"
      >
        <Heart className="mr-2 h-4 w-4" /> Favorites
      </Link>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-200">
      <LogoutButton />
    </div>
  </div>
);

export default UserDropdownContent;
