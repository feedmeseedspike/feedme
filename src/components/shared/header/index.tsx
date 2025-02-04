
// "use client";
import React, { useState, useEffect } from "react";
// import Container from "../Container";
import Image from "next/image";
// import Categories from "./Categories";
// import Auth from "./Auth";
// import Dashboard from "@/components/icons/Dashboard";
import Search from "./Search";
// import Cart from "./Cart";
// import Cart from "./Cart";
// import { useSelector } from "react-redux";
// import { useRouter } from 'next/navigation';
import Container from "@components/shared/Container";
import { Locations } from "@components/shared/header/Location";
import Cart from "@components/shared/header/Cart";
import Sidebar from "@components/shared/header/Sidebar";
import { CategoryResponse } from '../../../types/category';
import Link from "next/link";
import { headerMenus } from "src/lib/data";

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

  return (
    <header className=" ">
      <div className={`fixe bg-[#1B6013] transition-all duration-300 
        `}>
          <Container className="py-2">
            <div className="flex items-center h-auto">
              <nav className="rounded-xl flex flex-row w-full">
                <div className="flex flex-row gap-x-12 items-center relative">
                  <Image
                    src="/logo.png"
                    alt="logo"
                    width={148}
                    height={32}
                    className="w-[6rem] md:w-[9rem] cursor-pointer"
                    // onClick={() => router.push("/")}
                  />
                  <div className="hidden md:block pr-4 ">
                    <Locations />
                  </div>
  
                </div>
                  <div className="hidden md:block flex-1 md:max-w-[55rem]">
                    <Search  />
                  </div>
              </nav>
              <div className="pl-6 flex items-center gap-3">
                <Cart />
                <button className="bg-[#EAECF0] w-full h-[48px] rounded-[8px] text-[#1B6013] px-[16px] py-[8px] md:px-[20px] md:py-[12px] font-[600] whitespace-nowrap">Sign in</button>
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
