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

  // Define routes based on user role with categories
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
              badge:
                pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined,
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "buyer":
        return { label: "Customer", color: "bg-blue-100 text-blue-800" };
      case "seller":
        return { label: "Seller", color: "bg-green-100 text-green-800" };
      default:
        return { label: "Admin", color: "bg-purple-100 text-purple-800" };
    }
  };

  const roleBadge = getRoleBadge(user?.role || "buyer");

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
                            {item.badge && (
                              <Badge
                                variant={isActive ? "default" : "default"}
                                className={`text-xs ${
                                  isActive
                                    ? "bg-[#1B6013]/20 text-[#1B6013]"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {item.badge}
                              </Badge>
                            )}
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
