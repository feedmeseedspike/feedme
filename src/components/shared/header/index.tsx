import React from "react";
import Image from "next/image";
import { User, Package, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import Container from "@components/shared/Container";
import { Locations } from "@components/shared/header/Location";
import Cart from "@components/shared/header/Cart";
import Search from "./Search";
import Link from "next/link";
import { getUser } from "src/lib/actions/auth.actions";
import LogoutButton from "./LogoutButton";
import { Separator } from "@components/ui/separator";

const Header = async () => {
  const user = await getUser();
  // console.log(user);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-[#1B6013] transition-all duration-300 shadow-sm">
          <Container className="py-2 md:py-">
            <div className="flex items-center h-auto">
              <nav className="rounded-xl flex flex-row w-full">
                <div className="flex flex-row gap-x-6 md:gap-x-12 items-center relative">
                  <Link href="/">
                    <Image
                      src="/logo.png"
                      alt="logo"
                      width={148}
                      height={32}
                      className="w-[6rem] md:w-[9rem] cursor-pointer"
                    />
                  </Link>
                  <div className="pr-4">
                    <Locations />
                  </div>
                </div>
                <div className="hidden md:block flex-1 md:max-w-[55rem]">
                  <Search />
                </div>
              </nav>
              <div className="md:pl-6 flex items-center gap-3">
                <div className="cursor-pointer">
                  <Cart />
                </div>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex justify-center items-center gap-2 py-3 px-6 text-sm text-white rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 whitespace-nowrap"
                      >
                        <span>
                          <Avatar>
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.display_name[0]}
                            </AvatarFallback>
                          </Avatar>
                        </span>
                        <span className="hidden md:block">
                          Hello, {user.display_name}
                        </span>
                        <svg
                          className="w-2.5 h-2.5 text-white transition-transform"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 5L8.16086 10.6869C8.35239 10.8637 8.64761 10.8637 8.83914 10.6869L15 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-72">
                      <div className="px-4 py-3 flex gap-3">
                        <div>
                          <div className="text-[#1B6013] font-normal mb-1">
                            {user.display_name}
                          </div>
                          <div className="text-sm text-gray-500 font-medium truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <Separator className="my-2" />

                      <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-600" />
                        <Link href={"/account"}>Your account</Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                        <Package className="w-5 h-5 text-gray-600" />
                        Orders
                      </DropdownMenuItem>

                      <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                        <Heart className="w-5 h-5 text-gray-600" />
                        <Link href={"/account/favourites"}>Favourites</Link>
                      </DropdownMenuItem>

                      <Separator className="my-2" />

                      <DropdownMenuItem asChild>
                        <LogoutButton />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/login">
                    <button className="bg-[#EAECF0] w-full rounded-[8px] text-[#1B6013] px-[16px] py-[8px] md:px-[20px] md:py-[12px] font-[600] whitespace-nowrap">
                      Sign in
                    </button>
                  </Link>
                )}
              </div>
            </div>
            <div className="py-2 w-full md:hidden">
              <Search />
            </div>
          </Container>
        </div>
      </header>
      <div className="h-[80px] md:h-[50px]"></div>
    </>
  );
};

export default Header;
