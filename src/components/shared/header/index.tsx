
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

const fetchCategories = async (): Promise<CategoryResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category/get-categories`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

const Header = async () => {
  const categoriesResponse = await fetchCategories();
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
    <header className="">
      <div className={`fixe bg-[#1B6013] h-[80px] top-0 left-0 right-0 z-50 transition-all duration-300 
      // {isScrolled ? ' shadow-md' : ''}
      `}>
        <Container className="">
          <div className="flex items-center">
            <nav className="rounded-xl pt-4 pb-2 flex flex-row ">
              <div className="flex flex-row gap-x-12 items-center relative">
                <Image
                  src="/logo.png"
                  alt="logo"
                  width={148}
                  height={32}
                  className=" object-contain md:block hidde cursor-pointer"
                  // onClick={() => router.push("/")}
                />
                <div className="pr-4">
                  <Locations />
                </div>

              </div>
              <div className="flex flex-row gap-x-2 relative">
                <div className="hidden sm:block w-fu sm:w-[880px]">
                  <Search  />
                </div>
                {/* {user && Object?.keys(user)?.length > 0 && (
                  <button
                    className="p-2 rounded-secondary hover:bg-slate-100 transition-colors"
                    onClick={() => router.push("/dashboard")}
                  >
                    <Dashboard className="h-6 w-6" />
                  </button>
                )} */}
                {/* <Auth /> */}
              </div>
            </nav>
            <div className="pb-2 sm:hidden">
                <Search />
            </div>
            <div className="pl-6 flex items-center gap-3">
              <Cart />
              <button className="bg-[#EAECF0] w-[93px h-[48px] rounded-[8px] text-[#1B6013] px-[20px] py-[12px] font-[600]">Sign in</button>
            </div>

          </div>
          <div className="my-7 flex items-center gap-x-2 ">
            <Sidebar categories={categoriesResponse.data} />
            <div className="border-l h-7 rounded" /> 
            <div className='flex items-center px-3 text-[14px] '>
              <div className='flex items-center flex-wrap gap-3 overflow-hidden '>
                {headerMenus.map((menu) => (
                  <Link
                    href={menu.href}
                    key={menu.href}
                    className='header-button !p-2 '
                  >
                    {menu.name}
                  </Link>
                ))}
              </div>
          </div>
        </div>
        </Container>
      </div>

    </header>
  );
};

export default Header;
