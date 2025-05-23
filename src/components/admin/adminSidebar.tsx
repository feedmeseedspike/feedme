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
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import LogoutButton from "@components/shared/header/LogoutButton";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@components/ui/sheet";

interface AppSidebarProps {
  user: UserData;
}

export function AdminSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Redirect "/admin" to "/admin/overview"
  useEffect(() => {
    if (pathname === "/admin") {
      router.replace("/admin/overview");
    }
  }, [pathname, router]);

  const routes: Route[] = [
    { title: "Overview", url: "/admin/overview", icon: Overview },
    { title: "Orders", url: "/admin/orders", icon: Order },
    { title: "Products", url: "/admin/products", icon: Product },
    { title: "Categories", url: "/admin/categories", icon: Product },
    { title: "Bundles", url: "/admin/bundles", icon: Bundle },
    { title: "Agents", url: "/admin/agents", icon: User },
    { title: "Customers", url: "/admin/customers", icon: Profile },
    { title: "Promotions", url: "/admin/promotions", icon: Product },
  ];

  const RenderSidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <SidebarGroup>
          <Circles />
          <Link href={"/"}>
            <Image
              src="/footerlogo.png"
              alt="logo"
              width={141}
              height={40}
              className="pt-6 cursor-pointer"
            />
          </Link>
          <SidebarGroupContent>
            <SidebarMenu className="my-6 flex gap-2 overflow-y-auto max-h-[calc(100vh-200px)]">
              {routes.map((item) => {
                const isActive = pathname.startsWith(item.url);

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
                        onClick={() => setOpen(false)}
                      >
                        <span className={`size-5 text-[#667085] hover:fill-white ${isActive && "fill-white"}`}>
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
      </div>

      {/* User Section */}
      <div className="p-6 bg-[#09244B08] shadow-[inset_0px_1.3px_0px_0px_#F2F4F6]">
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
    </div>
  );

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            <RenderSidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop View */}
      <Sidebar className="fixed z-50 h-full hidden lg:block">
        <SidebarContent>
          <RenderSidebarContent />
        </SidebarContent>
      </Sidebar>
    </>
  );
}
