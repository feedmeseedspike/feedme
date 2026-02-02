"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@components/ui/dropdown-menu";
import { Button } from "@components/ui/button";
import {
  ChevronDown,
  User,
  ShoppingBag,
  Wallet,
  Heart,
  History,
  Key,
  Store,
  Package,
  Grid,
  ClipboardList,
  Bell,
  Gift,
} from "lucide-react"; 
import LogoutButton from "@components/shared/header/LogoutButton";
import { UserData } from "src/types";

interface ProfileDropdownProps {
  user: UserData;
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const pathname = usePathname();

  const getRoutesByRole = (role: string) => {
    switch (role) {
      case "buyer":
        return {
          main: [
            {
              title: "Profile",
              url: "/account",
              icon: User,
              description: "Manage your profile",
            },
            {
              title: "Orders",
              url: "/account/order",
              icon: ShoppingBag,
              description: "Track your orders",
              // badge: "3",
            },
            {
              title: "Wallet",
              url: "/account/wallet",
              icon: Wallet,
              description: "Manage payments",
            },
            {
              title: "Favourites",
              url: "/account/favourites",
              icon: Heart,
              description: "Saved products",
            },
            {
              title: "Referral",
              url: "/account/referral",
              icon: Bell,
              description: "Referral from friends",
            },
            {
              title: "My Rewards",
              url: "/account/rewards",
              icon: Gift,
              description: "Spin & Win Prizes",
            }
          ],
          secondary: [
            {
              title: "Browsing History",
              url: "/browsing-history",
              icon: History,
              description: "Recently viewed",
            },
            {
              title: "Change Password",
              url: "/account/password",
              icon: Key,
              description: "Security settings",
            },
          ],
        };
      case "seller":
        return {
          main: [
            {
              title: "Profile",
              url: "/account",
              icon: User,
              description: "Manage your profile",
            },
            {
              title: "My Store",
              url: "/account/store",
              icon: Store,
              description: "Store settings",
            },
            {
              title: "Products",
              url: "/account/products",
              icon: Package,
              description: "Manage inventory",
            },
            {
              title: "Orders",
              url: "/account/orders",
              icon: ShoppingBag,
              description: "Customer orders",
              // badge: "12",
            },
          ],
          secondary: [
            {
              title: "Wallet",
              url: "/account/wallet",
              icon: Wallet,
              description: "Earnings & payouts",
            },
            {
              title: "Analytics",
              url: "/account/analytics",
              icon: Grid,
              description: "Sales insights",
            },
          ],
        };
      default: // admin
        return {
          main: [
            {
              title: "Overview",
              url: "/admin/overview",
              icon: Grid,
              description: "Dashboard overview",
            },
            {
              title: "Products",
              url: "/admin/products",
              icon: Package,
              description: "Product management",
            },
            {
              title: "Categories",
              url: "/admin/categories",
              icon: ClipboardList,
              description: "Category management",
            },
            {
              title: "Orders",
              url: "/admin/orders",
              icon: ShoppingBag,
              description: "Order management",
              // badge will be handled by a query in the AppSidebar
            },
          ],
          secondary: [
            {
              title: "Customers",
              url: "/admin/customers",
              icon: User,
              description: "User management",
            },
            {
              title: "Agents",
              url: "/admin/agents",
              icon: User,
              description: "Agent management",
            },
            {
              title: "Promotions",
              url: "/admin/promotions",
              icon: Heart,
              description: "Marketing campaigns",
            },
            {
              title: "Bundles",
              url: "/admin/bundles",
              icon: Package,
              description: "Product bundles",
            },
          ],
        };
    }
  };

  const routes = getRoutesByRole(user?.role || "buyer");

  return (
    <div className="lg:hidden w-full py-2 flex items-center justify-between border-b mb-4 border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800">My Profile</h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-1">
            Account Navigation
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {routes.main.map((item) => (
            <Link key={item.title} href={item.url}>
              <DropdownMenuItem className="cursor-pointer">
                <item.icon className="w-4 h-4 mr-2" />
                <span>{item.title}</span>
              </DropdownMenuItem>
            </Link>
          ))}
          <DropdownMenuSeparator />
          {routes.secondary.map((item) => (
            <Link key={item.title} href={item.url}>
              <DropdownMenuItem className="cursor-pointer">
                <item.icon className="w-4 h-4 mr-2" />
                <span>{item.title}</span>
              </DropdownMenuItem>
            </Link>
          ))}
          {/* <DropdownMenuSeparator /> */}
          {/* <DropdownMenuItem className="cursor-pointer">
            <LogoutButton />
          </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
