"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  User,
  Package,
  Heart,
  ChevronDown,
  ChevronLeft,
  Wallet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import Container from "@components/shared/Container";
import Cart from "@components/shared/header/Cart";
import Search from "./Search";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { Separator } from "@components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { getUserQuery } from "src/queries/auth";
import { getAllCategoriesQuery } from "src/queries/categories";
import { Skeleton } from "@components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/ui/sheet";
import { Button } from "@components/ui/button";
import { createClient } from "@utils/supabase/client";
import { Tables } from "src/utils/database.types";

type Category = Tables<"categories">;

const Header = () => {
  const supabase = createClient();
  const { data: user, isLoading: isUserLoading } = useQuery({
    ...getUserQuery(),
    staleTime: 1000 * 60 * 5, // Keep user data fresh for 5 minutes
  });
  const isLoggedIn = !!user;
  const [openAccountSheet, setOpenAccountSheet] = useState(false);

  // Fetch categories
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await getAllCategoriesQuery(supabase).select("*");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // Keep categories data fresh for 5 minutes
  });

  return (
    <header className="top-0 left-0 right-0 z-50 sticky">
      <div className="bg-[#1B6013] shadow-sm">
        <Container className="pt-4 pb-2 md:py-4">
          <div className="flex items-center h-auto">
            {/* Logo and Mobile Menu */}
            <nav className="rounded-xl flex flex-row w-full">
              <div className="flex flex-row gap-x-6 md:gap-x-12 items-center relative">
                {/* Mobile Sheet Menu */}
                <Sheet>
                  <SheetTrigger className="md:hidden" asChild>
                    <Button
                      variant="ghost"
                      className="p-0 hover:bg-transparent"
                    >
                      <svg
                        className="text-white fill-white"
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="10"
                        aria-label="side menu"
                      >
                        <path
                          stroke="currentColor"
                          strokeWidth="1.5"
                          d="M.7 9.75h20M.7 1.717h20"
                        />
                      </svg>
                    </Button>
                  </SheetTrigger>

                  <SheetContent
                    side="left"
                    className="w-[90%] bg-[#1B6013] text-white flex flex-col !px-4 !pb-0"
                  >
                    <SheetHeader>
                      <SheetTitle>
                        <Link href="/">
                          <Image
                            src="/logo.png"
                            alt="logo"
                            width={100}
                            height={32}
                            className="w-[6rem] cursor-pointer"
                          />
                        </Link>
                      </SheetTitle>
                    </SheetHeader>

                    {/* Scrollable Categories Section */}
                    <div className="flex-1 overflow-y-auto py-4">
                      <div className="pb-4">
                        {isCategoriesLoading ? (
                          <div className="space-y-2">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Skeleton
                                  key={i}
                                  className="w-full h-6 bg-white/30"
                                />
                              ))}
                          </div>
                        ) : categoriesError ? (
                          <p className="text-red-300">
                            Failed to load categories
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {categories?.map((category) => (
                              <Link
                                key={category.id}
                                href={`/category/${
                                  category.tags || category.id
                                }`}
                                className="block py-2 hover:bg-white/10 rounded text-lg px-2 transition-colors"
                              >
                                {category.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fixed Account Link at Bottom */}
                    <div className="border-t border-white">
                      <Sheet
                        open={openAccountSheet}
                        onOpenChange={setOpenAccountSheet}
                      >
                        <SheetTrigger asChild>
                          <button className="flex items-center gap-2 p-3 hover:bg-white/10 rounded transition-colors w-full">
                            <User className="size-6" />
                            <span>Your Account</span>
                          </button>
                        </SheetTrigger>
                        <SheetContent
                          side="left"
                          className="w-[90%] bg-[#1B6013] text-white"
                        >
                          <Button
                            variant="ghost"
                            onClick={() => setOpenAccountSheet(false)}
                            className="p-0 hover:bg-transparent absolute left-4 top-4"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </Button>

                          <div className="pt-16">
                            {isUserLoading ? (
                              <div className="space-y-4">
                                <Skeleton className="w-32 h-8 bg-white/30" />
                                <Skeleton className="w-48 h-4 bg-white/30" />
                              </div>
                            ) : isLoggedIn ? (
                              <>
                                <div className="px-4 py-3 text-center">
                                  <Avatar className="mx-auto size-16 mb-4">
                                    <AvatarImage src={user?.avatar_url} />
                                    <AvatarFallback>
                                      {user?.display_name?.[0] || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <p className="font-semibold text-xl">
                                    {user?.display_name || "User"}
                                  </p>
                                  <p className="text-sm text-white/80 truncate">
                                    {user?.email}
                                  </p>
                                </div>
                                <Separator className="bg-white/30 my-4" />
                                <Link
                                  href="/account"
                                  className="flex items-center gap-2 p-4 hover:bg-white/10 rounded transition-colors"
                                >
                                  <User className="w-5 h-5" />
                                  Account Settings
                                </Link>
                                <Link
                                  href="/account/order"
                                  className="flex items-center gap-2 p-4 hover:bg-white/10 rounded transition-colors"
                                >
                                  <Package className="w-5 h-5" />
                                  My Orders
                                </Link>
                                <Link
                                  href="/account/wallet"
                                  className="flex items-center gap-2 p-4 hover:bg-white/10 rounded transition-colors"
                                >
                                  <Wallet className="w-5 h-5" />
                                  Wallet
                                </Link>
                                <Link
                                  href="/account/favourites"
                                  className="flex items-center gap-2 p-4 hover:bg-white/10 rounded transition-colors"
                                >
                                  <Heart className="w-5 h-5" />
                                  Favorites
                                </Link>
                                <div className="mt-8">
                                  <LogoutButton />
                                </div>
                              </>
                            ) : (
                              <div className="space-y-4 pt-8">
                                <p className="text-center">
                                  Please sign in to access your account
                                </p>
                                <Link
                                  href="/login"
                                  className="block w-full text-center bg-white/10 hover:bg-white/20 py-3 rounded transition-colors"
                                >
                                  Sign In
                                </Link>
                                <Link
                                  href="/register"
                                  className="block w-full text-center bg-white text-[#1B6013] hover:bg-white/90 py-3 rounded transition-colors"
                                >
                                  Create Account
                                </Link>
                              </div>
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </SheetContent>
                </Sheet>
                {/* Desktop Logo */}
                <Link href="/">
                  <Image
                    src="/logo.png"
                    alt="logo"
                    width={148}
                    height={32}
                    className="w-[6rem] md:w-[9rem] cursor-pointer"
                  />
                </Link>
              </div>

              {/* Desktop Search */}
              <div className="hidden md:block flex-1 md:max-w-[55rem] pl-8">
                <Search />
              </div>
            </nav>

            {/* Cart and User Actions */}
            <div className="md:pl-6 flex items-center gap-3">
              <Cart />

              {/* Desktop User Dropdown */}
              <div className="hidden md:block">
                {isUserLoading ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-10 rounded-full bg-white/60" />
                    <Skeleton className="w-24 h-6 rounded-full bg-white/60" />
                  </div>
                ) : isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex justify-center items-center gap-2 py-3 px-6 text-sm text-white rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 whitespace-nowrap">
                        <Avatar>
                          <AvatarImage src={user?.avatar_url} />
                          <AvatarFallback>
                            {user?.display_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          Hello, {user?.display_name?.split(" ")[0] || "User"}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <div className="px-4 py-3 flex gap-3">
                        <p className="font-semibold text-md mb-1">
                          Welcome, {user?.display_name}
                        </p>
                        {/* <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p> */}
                      </div>
                      <Separator />
                      <DropdownMenuItem asChild>
                        <Link href="/account" className="w-full">
                          <User className="mr-2 h-4 w-4" />
                          Account
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/order" className="w-full">
                          <Package className="mr-2 h-4 w-4" />
                          Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                        <Heart className="w-5 h-5 text-gray-600" />
                        <Link href={"/account/favourites"}>Favourites</Link>
                      </DropdownMenuItem>
                      <Separator className="my-2" />
                      <DropdownMenuItem asChild className="px-4">
                        <LogoutButton />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/login">
                    <Button
                      variant="secondary"
                      className="bg-white text-[#1B6013]"
                    >
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="py-2 w-full md:hidden">
            <Search />
          </div>
        </Container>
      </div>
    </header>
  );
};

export default Header;
