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
  History
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
import { usePathname } from "next/navigation"; // Import usePathname
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import LogoutButton from "@components/shared/header/LogoutButton";

interface AppSidebarProps {
  user: UserData;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname(); // Get the current route

  let routes: Route[] = [];

  if (user?.role === "buyer") {
    routes = [
      { title: "My Profile", url: "/account", icon: User },
      { title: "Orders", url: "/account/orders", icon: ClipboardList },
      { title: "Wishlist", url: "/customer/favourites", icon: Heart },
      { title: "Recently Viewed", url: "/cart", icon: History },
    ];
  }

  if (user?.role === "seller") {
    routes = [
      { title: "Profile", url: "/dashboard/seller/my-profile", icon: User },
      { title: "Brand", url: "/dashboard/seller/my-brand", icon: Store },
      { title: "Category", url: "/dashboard/seller/my-category", icon: Grid },
      { title: "Store", url: "/dashboard/seller/my-store", icon: Store },
      { title: "Add Product", url: "/dashboard/seller/add-product", icon: Package },
      { title: "List Products", url: "/dashboard/seller/list-products", icon: Package },
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
    <Sidebar className="mt-6">
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
          <SidebarGroupContent>
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
                            ? "bg-[#1B6013] text-white rounded-[10px]" // Active state
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

      {/* Fixed Bottom User Section */}
      {/* <div className="absolute bottom-0 left-0 w-[315px] p-6 bg-[#09244B08] shadow-[inset_0px_1.3px_0px_0px_#F2F4F6]">
        <div className="flex gap-2">
          <div className="flex gap-2 items-center">
            <Avatar>
              <AvatarImage src={user?.avatar.url} />
              <AvatarFallback>{user?.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-lg text-black">{user?.name}</h3>
              <p className="truncate text-[14px]">{user?.email}</p>
            </div>
          </div>
          <LogoutButton showText={false} />
        </div>
      </div> */}
    </Sidebar>
  );
}
