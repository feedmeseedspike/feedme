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
  Key
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
} from "../../ui/sidebar";
import Image from "next/image";
import { Route, UserData } from "src/types";
import Link from "next/link";
import { usePathname } from "next/navigation"; 
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import LogoutButton from "@components/shared/header/LogoutButton";

interface AppSidebarProps {
  user: UserData;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname(); 

  let routes: Route[] = [];

  if (user?.role === "buyer") {
    routes = [
      { title: "My Profile", url: "/account", icon: User },
      { title: "Orders", url: "/account/order", icon: ClipboardList },
      { title: "Password Manager", url: "/account/password", icon: Key },
      { title: "Wishlist", url: "/account/favourites", icon: Heart },
      { title: "Recently Viewed", url: "/browsing-history", icon: History },
    ];
  }

  if (user?.role === "seller") {
    routes = [
      { title: "My Profile", url: "/account", icon: User },
      { title: "Orders", url: "/account/order", icon: ClipboardList },
      { title: "Password Manager", url: "/account/password", icon: Key },
      { title: "Wishlist", url: "/account/favourites", icon: Heart },
      { title: "Recently Viewed", url: "/account/history", icon: History },
    ];
  }

  if (user?.role === "admin") {
    routes = [
      { title: "Brands", url: "/dashboard/admin/list-brands", icon: Store },
      { title: "Categories", url: "/dashboard/admin/list-categories", icon: Grid },
      { title: "Stores", url: "/dashboard/admin/list-stores", icon: Store },
      { title: "Products", url: "/dashboard/admin/list-products", icon: Package },
      { title: "Add Product", url: "/dashboard/seller/add-product", icon: Package },
      { title: "Purchases", url: "/dashboard/admin/list-purchases", icon: ShoppingBag },
      { title: "Offline Orders", url: "/dashboard/agent/offline-order", icon: ClipboardList },
    ];
  }

  return (
    <Sidebar  className="sticky top-0 h-[calc(100vh-80px)] py-4 overflow-y-auto">
      <SidebarContent>
        <SidebarGroup>
          {/* <Circles className="mt-6" />
          <div>
            <Image
              src="/footerlogo.png"
              alt="logo"
              width={141}
              height={40}
              className="pt-6 cursor-pointer"
            />
          </div> */}
          <SidebarGroupContent  >
            <SidebarMenu className="mt-6 flex gap-2">
              {routes.map((item) => {
                const isActive = pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton className="w-full">
                      <Link
                        href={item.url}
                        className={`my-3 !flex !items-center gap-4 px-2 py-3 rounded-lg transition-all duration-300 w-full ${
                          isActive
                            ? "bg-[#1B6013] text-white rounded-[10px]"
                            : "hover:bg-[#1B6013] hover:text-white"
                        }`}
                      >
                        <span className="size-5">
                          <item.icon />
                        </span>
                        <span className="text-xl">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
