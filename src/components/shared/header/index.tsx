// "use client";
import React, { useState, useEffect } from "react";
// import Container from "../Container";
import Image from "next/image";
// import Categories from "./Categories";
// import Auth from "./Auth";
// import Dashboard from "@/components/icons/Dashboard";
import Search from "./Search";
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
import Sidebar from "@components/shared/header/Sidebar";
import { CategoryResponse } from "../../../types/category";
import Order from "@components/icons/orders.svg";
import Avatars from "@components/icons/avatar.svg";
import Link from "next/link";
import { headerMenus } from "src/lib/data";
import { getUser } from "src/lib/actions/user.actions";
import { Heart } from "lucide-react";

// const fetchCategories = async (): Promise<CategoryResponse> => {
//   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category/get-categories`, {
//     cache: 'no-store',
//   });
//   if (!response.ok) {
//     throw new Error('Failed to fetch categories');
//   }
//   return response.json();
// };

const Header = async () => {
  // const categoriesResponse = await fetchCategories();
  // console.log(categoriesResponse)
  // const [isScrolled, setIsScrolled] = useState(false);
  // const user = useSelector((state) => state?.auth?.user);
  // const router = useRouter();

  // useEffect(() => {
  //   const handleScroll = () => {
  //     if (window.scrollY > 0) {
  //       setIsScrolled(true);
  //     } else {
  //       setIsScrolled(false);
  //     }
  //   };

  //   window.addEventListener('scroll', handleScroll);
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  const user = await getUser();
  console.log(user.data._id);

  return (
    <header className="">
      <div
        className={`fixe bg-[#1B6013] transition-all duration-300 
        `}
      >
        <Container className="py-2">
          <div className="flex items-center h-auto">
            <nav className="rounded-xl flex flex-row w-full">
              <div className="flex flex-row gap-x-12 items-center relative">
                <Link href="/">
                  <Image
                    src="/logo.png"
                    alt="logo"
                    width={148}
                    height={32}
                    className="w-[6rem] md:w-[9rem] cursor-pointer"
                  />
                </Link>
                <div className="hidden md:block pr-4 ">
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
                      <span className="">
                        <Avatar>
                        <AvatarImage src={user.data.avatar.url} />
                        <AvatarFallback>{user.data.name[0]}</AvatarFallback>
                      </Avatar>
                      {/* || <Avatars className="size-6" /> */}
                      </span>
                      <span className="hidden md:block">
                        Hello, {user.data.name}
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
                      {/* <Avatar>
                        <AvatarImage src={user.data.avatar.url} />
                        <AvatarFallback>{user.data.name[0]}</AvatarFallback>
                      </Avatar> */}
                      <div>
                        <div className="text-[#1B6013] font-normal mb-1">
                          {user.data.name}
                        </div>
                        <div className="text-sm text-gray-500 font-medium truncate">
                          {user.data.email}
                        </div>
                      </div>
                    </div>

                    <DropdownMenuItem className="cursor-pointer">
                      Your account
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <button className="bg-[#EAECF0] w-full h-[48px] rounded-[8px] text-[#1B6013] px-[16px] py-[8px] md:px-[20px] md:py-[12px] font-[600] whitespace-nowrap">
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
  );
};

export default Header;
