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
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar"
import Container from "@components/shared/Container";
import { Locations } from "@components/shared/header/Location";
import Cart from "@components/shared/header/Cart";
import Sidebar from "@components/shared/header/Sidebar";
import { CategoryResponse } from "../../../types/category";
import Order  from "@components/icons/orders.svg"
import Link from "next/link";
import { headerMenus } from "src/lib/data";
import { getUser } from "src/lib/actions/user.actions";

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
  console.log(user)

  return (
    <header className=" ">
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
              {
                user 
                ? 
                <div className="dropdown relative inline-flex">
                <button type="button" data-target="dropdown-with-subheading" className="dropdown-toggle inline-flex justify-center items-center gap-2 py-3 px-6 text-sm  text-white rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500  "> Hello, {user.data.name}  <svg className="dropdown-open:rotate-180 w-2.5 h-2.5 text-white" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M2 5L8.16086 10.6869C8.35239 10.8637 8.64761 10.8637 8.83914 10.6869L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                </svg>
                </button>
                <div id="dropdown-with-subheading" className="dropdown-menu rounded-xl shadow-lg bg-white absolute right-0 z-50 top-full w- md:w-72 mt-2 divide-y divide-gray-200" aria-labelledby="dropdown-with-subheading">
                <div className="px-4 py-3 flex gap-3 ">
                 <div className="block mt-1">
                   <Avatar>
                    <AvatarImage src={user.data.avatar.url}/>
                    <AvatarFallback>{user.data.name[0]}</AvatarFallback>
                   </Avatar>
                 </div>
                 <div className="block">
                   <div className="text-[#1B6013] font-normal mb-1">{user.data.name}</div>
                   <div className="text-sm text-gray-500 font-medium truncate">{user.data.email}</div>
                 </div>
                </div>
                <ul className="py-2">
                 <li>
                   <a className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 text-gray-900 font-medium" href="javascript:;">
                     <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M15.4167 7.5C16.5673 7.5 17.5 8.43274 17.5 9.58333V12.5C17.5 14.857 17.5 16.0355 16.7678 16.7678C16.0355 17.5 14.857 17.5 12.5 17.5H7.5C5.14298 17.5 3.96447 17.5 3.23223 16.7678C2.5 16.0355 2.5 14.857 2.5 12.5V9.58333C2.5 8.43274 3.43274 7.5 4.58333 7.5M10 13.3333L6.50337 9.83671M10 13.3333L13.4966 9.83671M10 13.3333V2.5" stroke="black" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
                     </svg> Your account </a>
                 </li>
                 <li>
                   <a className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 text-gray-900 font-medium" href="javascript:;">
                   <svg viewBox="0 0 1024 1024" fill="#000000" className="icon size-5" version="1.1" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.01024"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M300 462.4h424.8v48H300v-48zM300 673.6H560v48H300v-48z" fill=""></path><path d="M818.4 981.6H205.6c-12.8 0-24.8-2.4-36.8-7.2-11.2-4.8-21.6-11.2-29.6-20-8.8-8.8-15.2-18.4-20-29.6-4.8-12-7.2-24-7.2-36.8V250.4c0-12.8 2.4-24.8 7.2-36.8 4.8-11.2 11.2-21.6 20-29.6 8.8-8.8 18.4-15.2 29.6-20 12-4.8 24-7.2 36.8-7.2h92.8v47.2H205.6c-25.6 0-47.2 20.8-47.2 47.2v637.6c0 25.6 20.8 47.2 47.2 47.2h612c25.6 0 47.2-20.8 47.2-47.2V250.4c0-25.6-20.8-47.2-47.2-47.2H725.6v-47.2h92.8c12.8 0 24.8 2.4 36.8 7.2 11.2 4.8 21.6 11.2 29.6 20 8.8 8.8 15.2 18.4 20 29.6 4.8 12 7.2 24 7.2 36.8v637.6c0 12.8-2.4 24.8-7.2 36.8-4.8 11.2-11.2 21.6-20 29.6-8.8 8.8-18.4 15.2-29.6 20-12 5.6-24 8-36.8 8z" fill=""></path><path d="M747.2 297.6H276.8V144c0-32.8 26.4-59.2 59.2-59.2h60.8c21.6-43.2 66.4-71.2 116-71.2 49.6 0 94.4 28 116 71.2h60.8c32.8 0 59.2 26.4 59.2 59.2l-1.6 153.6z m-423.2-47.2h376.8V144c0-6.4-5.6-12-12-12H595.2l-5.6-16c-11.2-32.8-42.4-55.2-77.6-55.2-35.2 0-66.4 22.4-77.6 55.2l-5.6 16H335.2c-6.4 0-12 5.6-12 12v106.4z" fill=""></path></g></svg> Orders </a>
                 </li>
                 <li>
                   <Link className="flex items-center gap-3  px-6 py-2 hover:bg-gray-100 text-gray-900 font-medium" href={"/customer/favourites"}>
                     <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M15.1116 9.16666C15.2575 10.9606 15.8104 12.3731 16.3475 13.3586C16.7027 14.0104 16.2305 15 15.4881 15H4.51181C3.76939 15 3.27739 13.995 3.61578 13.3342C4.28214 12.0329 4.99996 9.94714 4.99996 6.99999C4.99996 5.58582 5.52663 4.22916 6.46413 3.22916C7.40246 2.22916 8.67496 1.66666 9.99996 1.66666C10.2808 1.66666 10.56 1.69166 10.8333 1.74166M11.4416 17.5C11.2953 17.7528 11.0851 17.9626 10.832 18.1085C10.579 18.2544 10.292 18.3312 9.99996 18.3312C9.70788 18.3312 9.42094 18.2544 9.1679 18.1085C8.91487 17.9626 8.70464 17.7528 8.5583 17.5M15 6.66666C15.663 6.66666 16.2989 6.40326 16.7677 5.93442C17.2366 5.46558 17.5 4.8297 17.5 4.16666C17.5 3.50362 17.2366 2.86773 16.7677 2.39889C16.2989 1.93005 15.663 1.66666 15 1.66666C14.3369 1.66666 13.701 1.93005 13.2322 2.39889C12.7634 2.86773 12.5 3.50362 12.5 4.16666C12.5 4.8297 12.7634 5.46558 13.2322 5.93442C13.701 6.40326 14.3369 6.66666 15 6.66666Z" stroke="#111827" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
                     </svg> Favourites </Link>
                 </li>
                </ul>
                <div className="py-2">
                 <a className="block px-6 py-2  text-red-500 font-medium" href="javascript:;"> Log Out </a>
                </div>
                </div>
                </div>
                : 
                (<Link href="/login">
                <button className="bg-[#EAECF0] w-full h-[48px] rounded-[8px] text-[#1B6013] px-[16px] py-[8px] md:px-[20px] md:py-[12px] font-[600] whitespace-nowrap">
                  Sign in
                </button>
              </Link>)
              }
              
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
