"use client";

import {
  User,
  ShoppingCart,
  Heart,
  Store,
  Package,
  Grid,
  ShoppingBag,
  ClipboardList,
  History,
  Key,
  Wallet,
  Home,
  Settings,
  ChevronRight,
  Bell,
  HelpCircle,
  Gift,
} from "lucide-react";
import Circles from "../../icons/Cirles.svg";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "../../ui/sidebar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";
import Image from "next/image";
import { Route, UserData } from "src/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import LogoutButton from "@components/shared/header/LogoutButton";
import { useQuery } from "@tanstack/react-query";
import { fetchPendingOrdersCount } from "src/queries/orders";

interface AppSidebarProps {
  user: UserData;
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const { data: pendingOrdersCount = 0 } = useQuery({
    queryKey: ["pendingOrdersCount"],
    queryFn: fetchPendingOrdersCount,
    enabled: user?.role === "admin",
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  // Only show buyer routes, remove role logic
  const routes = {
    main: [
      {
        title: "Profile",
        url: "/account/profile",
        icon: User,
        description: "Manage your profile",
      },
      {
        title: "Orders",
        url: "/account/order",
        icon: ShoppingBag,
        description: "Track your orders",
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
      },
    ],
    secondary: [
      {
        title: "Notifications",
        url: "/account/notifications",
        icon: Bell,
        description: "Your recent alerts",
      },
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

  // Always show buyer badge
  const roleBadge = { label: "Customer", color: "bg-blue-100 text-blue-800" };

  return (
    <Sidebar className="">
      <SidebarContent className="!p-0">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {routes.main.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={`group relative flex items-center gap-3 px-4 py-4 rounded-md transition-all duration-200 ${
                          isActive
                            ? "bg-gray-100 text-[#1B6013]"
                            : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                        }`}
                      >
                        <div
                          className={`p-1 rounded-lg ${
                            isActive
                              ? "bg-white"
                              : "bg-gray-100 group-hover:bg-white"
                          }`}
                        >
                          <item.icon
                            className={`w-4 h-4 ${
                              isActive
                                ? "text-[#1B6013]"
                                : "text-gray-600 group-hover:text-[#1B6013]"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.title}</span>
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isActive
                              ? "text-[#1B6013]/60 rotate-90"
                              : "text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1"
                          }`}
                        />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {/* Admin menu item, only for admin users */}
              {user?.role === "admin" && (
                <SidebarMenuItem key="Admin">
                  <SidebarMenuButton asChild>
                    <Link
                      href="/admin/overview"
                      className={`group relative flex items-center gap-3 px-4 py-4 rounded-md transition-all duration-200 ${
                        pathname.startsWith("/admin")
                          ? "bg-gray-100 text-[#1B6013]"
                          : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <div
                        className={`p-1 rounded-lg ${
                          pathname.startsWith("/admin")
                            ? "bg-white"
                            : "bg-gray-100 group-hover:bg-white"
                        }`}
                      >
                        <Grid
                          className={`w-4 h-4 ${
                            pathname.startsWith("/admin")
                              ? "text-[#1B6013]"
                              : "text-gray-600 group-hover:text-[#1B6013]"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Admin</span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          pathname.startsWith("/admin")
                            ? "text-[#1B6013]/60 rotate-90"
                            : "text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1"
                        }`}
                      />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-" />

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {routes.secondary.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-gray-100 text-[#1B6013]"
                            : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <item.icon
                          className={`w-4 h-4 ${
                            isActive
                              ? "text-[#1B6013]"
                              : "text-gray-500 group-hover:text-[#1B6013]"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">
                            {item.title}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator className="my-" />

        {/* Logout Button */}
        <LogoutButton />
      </SidebarContent>
    </Sidebar>
  );
}
