"use client";

import Order from "@components/icons/order.svg";
import Overview from "@components/icons/overview.svg";
import Product from "@components/icons/product.svg";
import User from "@components/icons/user.svg";
import Profile from "@components/icons/profile.svg";
import Bundle from "@components/icons/bundle.svg";
import Circles from "@components/icons/Cirles.svg";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@components/ui/sidebar";
import Image from "next/image";
import { Route, UserData } from "src/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Import useRouter
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import LogoutButton from "@components/shared/header/LogoutButton";
import { useEffect } from "react";

interface AppSidebarProps {
  user: UserData;
}

export function AdminSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Redirect "/admin" to "/admin/overview"
  useEffect(() => {
    if (pathname === "/admin") {
      router.replace("/admin/overview");
    }
  }, [pathname, router]);

  const routes: Route[] = [
    { title: "Overview", url: "/admin/overview", icon: Overview },
    { title: "Orders", url: "/dashboard/admin/list-categories", icon: Order },
    { title: "Products", url: "/admin/products", icon: Product },
    { title: "Bundles", url: "/dashboard/admin/list-products", icon: Bundle },
    { title: "Agents", url: "/admin/agents", icon: User },
    { title: "Customers", url: "/admin/customers", icon: Profile },
  ];

  return (
    <Sidebar className="t-6 fixed">
      <SidebarContent>
        <SidebarGroup>
          <Circles />
          <div>
            <Image
              src="/footerlogo.png"
              alt="logo"
              width={141}
              height={40}
              className="pt-6 cursor-pointer"
            />
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="mt-6 flex gap-2">
              {routes.map((item) => {
                const isActive = pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton className="w-full">
                      <Link
                        href={item.url}
                        className={`my-3 !flex !items-center gap-4 px-2 py-3 rounded-lg transition-all duration-300 w-full ${
                          isActive
                            ? "bg-[#1B6013] text-white rounded-[10px] "
                            : "hover:bg-[#1B6013] hover:text-white"
                        }`}
                      >
                        <span className={`size-5 text-[#667085] ${isActive && "fill-white"}`}>
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
      <div className="absolute bottom-0 left-0 w-[315px] p-6 bg-[#09244B08] shadow-[inset_0px_1.3px_0px_0px_#F2F4F6]">
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
      </div>
    </Sidebar>
  );
}
