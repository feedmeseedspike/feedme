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
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";
import Image from "next/image";
import { Route, UserData } from "src/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import LogoutButton from "@components/shared/header/LogoutButton";

interface AppSidebarProps {
  user: UserData;
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

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
              badge: "3",
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
              badge: "12",
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
              badge: "24",
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
    <Sidebar className="border-r-0 bg-gradient-to-b from-gray-50 to-white">
      <SidebarHeader className="p-6 pb-4">
        {/* <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Image 
              src={Circles} 
              alt="circles" 
              width={32} 
              height={32} 
              className="drop-shadow-sm"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-sm text-gray-500">Welcome back!</p>
          </div>
        </div> */}

        {/* User Profile Card */}
        <Card className="bg-[#1B6013] border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="ring-2 ring-white/20">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="bg-white/20 text-white">
                  {user?.display_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold truncate">{user?.display_name}</p>
                  <Badge className={`${roleBadge.color} text-xs`}>
                    {roleBadge.label}
                  </Badge>
                </div>
                <p className="text-xs text-white/80 truncate">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </SidebarHeader>

      <SidebarContent className="px-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {routes.main.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-[#1B6013] text-white shadow-lg shadow-green-500/25"
                            : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                        }`}
                      >
                        <div
                          className={`p-1 rounded-lg ${
                            isActive
                              ? "bg-white/20"
                              : "bg-gray-100 group-hover:bg-white"
                          }`}
                        >
                          <item.icon
                            className={`w-4 h-4 ${
                              isActive
                                ? "text-white"
                                : "text-gray-600 group-hover:text-[#1B6013]"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.title}</span>
                            {item.badge && (
                              <Badge
                                variant={isActive ? "secondary" : "default"}
                                className={`text-xs ${
                                  isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p
                            className={`text-xs truncate ${
                              isActive ? "text-white/80" : "text-gray-500"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isActive
                              ? "text-white/60 rotate-90"
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

        <Separator className="my-4" />

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Settings & More
          </SidebarGroupLabel>
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
                            ? "bg-[#1B6013] text-white"
                            : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <item.icon
                          className={`w-4 h-4 ${
                            isActive
                              ? "text-white"
                              : "text-gray-500 group-hover:text-[#1B6013]"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">
                            {item.title}
                          </span>
                          <p
                            className={`text-xs truncate ${
                              isActive ? "text-white/80" : "text-gray-400"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="p-4 border-t bg-gray-50/50">
        <div className="space-y-3">
          {/* Stats Card for non-buyers */}
          {user?.role !== "buyer" && (
            <Card className="bg-white border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {user?.role === "seller" ? "Total Sales" : "Active Users"}
                  </span>
                  <span className="font-bold text-[#1B6013]">
                    {user?.role === "seller" ? "₦125,000" : "1,234"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>This month</span>
                  <span className="text-green-600">+12%</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logout Button */}
          <LogoutButton />

          {/* Version Info */}
          <div className="text-center">
            <p className="text-xs text-gray-400">FeedMe v2.0</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
