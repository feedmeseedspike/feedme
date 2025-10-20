"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  User,
  Package,
  Heart,
  ChevronDown,
  ChevronLeft,
  Wallet,
  Briefcase,
} from "lucide-react";
import WaveReveal from "@/components/ui/wave-reveal";
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
import FlyoutLink from "./FlyoutLink";
import UserDropdownContent from "./UserDropdownContent";
import { useUser } from "src/hooks/useUser";

const HeaderClient = ({ categories, categoriesError, hasActiveJobs }: any) => {
  const { user, isLoading: isUserLoading } = useUser();
  const [openAccountSheet, setOpenAccountSheet] = useState(false);
  const [openMobileSheet, setOpenMobileSheet] = useState(false);
  const [isCategoriesLoading] = useState(false);

  if (isUserLoading) {
    return null;
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
                <Sheet open={openMobileSheet} onOpenChange={setOpenMobileSheet}>
                  <SheetTrigger className="md:hidden" asChild>
                    <Button
                      variant="ghost"
                      className="p-0 hover:bg-transparent"
                      onClick={() => setOpenMobileSheet(true)}
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
                    className="w-[80%] bg-[#1B6013] text-white flex flex-col h-full !px-4 !pb-0"
                  >
                    <SheetHeader>
                      <SheetTitle>
                        <Link
                          href="/"
                          onClick={() => setOpenMobileSheet(false)}
                        >
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
                            {/* Explore */}
                            <div className="pt-1 pb-3">
                              <p className="uppercase text-xs text-white/70 px-2 mb-1">
                                Explore
                              </p>
                              <div className="space-y-1">
                                <Link
                                  href="/bundles"
                                  className="block py-2 hover:bg-white/10 rounded text-lg px-2 transition-colors"
                                  onClick={() => setOpenMobileSheet(false)}
                                >
                                  Bundles
                                </Link>
                                <Link
                                  href="/offers"
                                  className="block py-2 hover:bg-white/10 rounded text-lg px-2 transition-colors"
                                  onClick={() => setOpenMobileSheet(false)}
                                >
                                  Offers
                                </Link>
                                <Link
                                  href="/blog"
                                  className="block py-2 hover:bg-white/10 rounded text-lg px-2 transition-colors"
                                  onClick={() => setOpenMobileSheet(false)}
                                >
                                  Blog
                                </Link>
                                <Link
                                  href="/customer-support"
                                  className="block py-2 hover:bg-white/10 rounded text-lg px-2 transition-colors"
                                  onClick={() => setOpenMobileSheet(false)}
                                >
                                  Customer Support
                                </Link>
                              </div>
                            </div>

                            {/* Categories */}
                            <p className="uppercase text-xs text-white/70 px-2 mt-2 mb-1">
                              Categories
                            </p>
                            {categories?.map((category: any) => (
                              <Link
                                key={category.id}
                                href={`/category/${category.tags || category.id}`}
                                className="block py-2 hover:bg-white/10 rounded text-lg px-2 transition-colors"
                                onClick={() => setOpenMobileSheet(false)}
                              >
                                {category.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Auth Footer */}
                    {!isLoggedIn && (
                      <div className="bg-[#1B6013] pb-4 pt-2">
                        <div className="flex flex-col gap-2 px-2">
                          <Link
                            href="/login"
                            className="block w-full text-center bg-white/10 py-3 rounded transition-colors"
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
                      </div>
                    )}
                  </SheetContent>
                </Sheet>

                {/* Desktop Logo */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Link href="/">
                      <Image
                        src="/logo.png"
                        alt="logo"
                        width={148}
                        height={32}
                        className="w-[6rem] md:w-[9rem] cursor-pointer"
                      />
                    </Link>

                    {/* Hiring Badge */}
                    {hasActiveJobs && (
                      <Link href="/careers" className="block">
                        <div className="absolute -top-2 md:-top-1 -right-4 md:-right-6 z-10">
                          {/* Animated Badge */}
                          <div className="bg-[#F0800F] text-white px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-300 hover:scale-110">
                            <WaveReveal
                              text="HIRING"
                              direction="up"
                              duration="400ms"
                              delay={100}
                              loop={true}
                              className="tracking-wide"
                            />
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
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

export default HeaderClient;
