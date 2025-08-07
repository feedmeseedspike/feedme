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
import { Route } from "src/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import LogoutButton from "@components/shared/header/LogoutButton";
import { useEffect, useState } from "react";
import { Menu, X, Brain, Tag } from "lucide-react";
import { Button } from "@components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@components/ui/sheet";
import { getUnviewedOrdersCount } from "src/queries/orders";
import { GetUserReturn } from "src/lib/actions/auth.actions";
import { createClient as createSupabaseClient } from "src/utils/supabase/client";
import { TiLocation } from "react-icons/ti";
import { useToast } from "@/hooks/useToast";

interface AppSidebarProps {
  user: GetUserReturn;
}

export function AdminSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unviewedOrders, setUnviewedOrders] = useState(0);
  const { showToast } = useToast();

  // Redirect "/admin" to "/admin/overview"
  useEffect(() => {
    if (pathname === "/admin") {
      router.replace("/admin/overview");
    }
  }, [pathname, router]);

  useEffect(() => {
    async function fetchBadge() {
      try {
        // Temporarily disabled due to missing admin_viewed column
        // const count = await getUnviewedOrdersCount();
        // setUnviewedOrders(count);
        setUnviewedOrders(0);
      } catch (e) {
        setUnviewedOrders(0);
      }
    }
    fetchBadge();

    // --- Supabase Realtime subscription for live badge updates ---
    const supabase = createSupabaseClient();
    const channel = supabase
      .channel("admin-unviewed-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          // Temporarily disabled due to missing admin_viewed column
          // Only refetch if a new order is inserted or admin_viewed changes to false
          // if (
          //   payload.eventType === "INSERT" ||
          //   (payload.eventType === "UPDATE" &&
          //     payload.new.admin_viewed === false)
          // ) {
          //   fetchBadge();
          //   showToast("New order received!", "info");
          //   // Play notification sound
          //   const audio = new Audio("/notification.mp3");
          //   audio.play();
          // }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showToast]);

  const routes: Route[] = [
    { title: "Overview", url: "/admin/overview", icon: Overview },
    { title: "Orders", url: "/admin/orders", icon: Order },
    { title: "Products", url: "/admin/products", icon: Product },
    { title: "Categories", url: "/admin/categories", icon: Product },
    { title: "Bundles", url: "/admin/bundles", icon: Bundle },
    { title: "Offers", url: "/admin/offers", icon: Tag },
    { title: "Agents", url: "/admin/agents", icon: User },
    { title: "Customers", url: "/admin/customers", icon: Profile },
    { title: "Promotions", url: "/admin/promotions", icon: Product },
    { title: "AI Analytics", url: "/admin/ai-analytics", icon: Brain },
    {
      title: "Delivery Locations",
      url: "/admin/delivery-locations",
      icon: TiLocation,
    },
  ];

  const RenderSidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <SidebarGroup>
          <Circles />
          <Link href={"/"}>
            <Image
              src="/Footerlogo.png"
              alt="logo"
              width={141}
              height={40}
              className="pt-6 cursor-pointer"
            />
          </Link>
          <SidebarGroupContent>
            <SidebarMenu className="my-6 flex gap-2 overflow-y-auto max-h-[calc(100vh-200px)]">
              {routes.map((item) => {
                const isActive = pathname?.startsWith(item.url);

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
                        <span
                          className={`size-5 text-[#667085] hover:fill-white ${isActive && "fill-white"}`}
                        >
                          {item.title === "Delivery Locations" ? (
                            <TiLocation
                              size={20}
                              color={isActive ? "white" : "#667085"}
                            />
                          ) : (
                            <item.icon />
                          )}
                        </span>
                        <span className="text-xl flex items-center gap-2">
                          {item.title}
                          {item.title === "Orders" && unviewedOrders > 0 && (
                            <span
                              className="ml-2 inline-block min-w-[18px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold text-center align-middle"
                              title={`${unviewedOrders} new orders`}
                            >
                              {unviewedOrders}
                            </span>
                          )}
                        </span>
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
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback>{user?.display_name?.[0] || ""}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-lg text-black">
                {user?.display_name}
              </h3>
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
