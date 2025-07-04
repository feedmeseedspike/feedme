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
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import Container from "@components/shared/Container";
import Cart from "@components/shared/header/Cart";
import Search from "./Search";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { Separator } from "@components/ui/separator";
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
import FlyoutLink from "./FlyoutLink";
import UserDropdownContent from "./UserDropdownContent";
import { useUser } from "src/hooks/useUser";

type Category = Tables<"categories">;

const Header = () => {
  const supabase = createClient();
  const { user, isLoading: isUserLoading } = useUser();
  console.log("signed in user", user)
  const [openAccountSheet, setOpenAccountSheet] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchCategories = async () => {
      setIsCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const { data, error } = await supabase.from("categories").select("*");
        if (error) throw error;
        setCategories(data || []);
      } catch (err: any) {
        setCategoriesError(err.message || "Failed to load categories");
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, [supabase]);

  if (isUserLoading) {
    return null; // Or return a skeleton if you want a loading state
  }
  const isLoggedIn = !!user;

  return (
    <header className="top-0 left-0 right-0 z-50 sticky">
      <div className="bg-[#1B6013] shadow-sm">
        <Container className="pt-4 pb-2 md:py-4">
          <div className="flex items-center h-auto">
            {/* Logo and Mobile Menu */}
            <nav className="rounded-xl flex flex-row w-full">
              <div className="flex flex-row gap-x-6 md:gap-x-12 items-center relative">
                {/* Mobile Sheet Menu for Categories */}
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
                            priority={true}
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
                          <p className="text-red-300">{categoriesError}</p>
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

                    <div className="border-t border-white">
                      {/* <Sheet
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
                                    <AvatarImage
                                      src={user?.avatar_url ?? undefined}
                                    />
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
                                  className="block w-full text-center bg-white/10  py-3 rounded transition-colors"
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
                      </Sheet> */}
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
                  <FlyoutLink
                    FlyoutContent={UserDropdownContent}
                    flyoutProps={{ user }}
                  >
                    <button className="inline-flex justify-center items-center gap-2 py-3 pl-6 text-sm text-white rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 whitespace-nowrap">
                      <Avatar>
                        <AvatarImage src={user?.avatar_url ?? undefined} />
                        <AvatarFallback>
                          {user?.display_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        Hello, {user?.display_name?.split(" ")[0] || "User"}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </FlyoutLink>
                ) : (
                  <Link href="/login">
                    <Button
                      variant="secondary"
                      className="bg-white text-[#1B6013] hover:!bg-none"
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
