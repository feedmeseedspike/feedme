"use client"

import Container from '@components/shared/Container'
import { Locations } from '@components/shared/header/Location'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Headroom from 'react-headroom'
import Search from "./Search";
import Cart from '@components/shared/header/Cart'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar'
import { Separator } from '@components/ui/separator'
import { Heart, Package, User } from 'lucide-react'
import LogoutButton from '@components/shared/header/LogoutButton'


const HeaderClient = ({user}: any) => {
  return (
    <Headroom className="z-[999]"
    // style={{
    //   zIndex: 50,
    //   transition: "all .5s ease-in-out",
    // }}
    // Customize these props as needed
    // upTolerance={10}
    // downTolerance={10}
    // pinStart={0}
    // disableInlineStyles={false}
  >
    <div className="bg-[#1B6013] transition-all duration-300 shadow-sm">
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
              <div className="hidden md:block pr-4">
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
                        <AvatarImage src={user.data.avatar.url} />
                        <AvatarFallback>{user.data.name[0]}</AvatarFallback>
                      </Avatar>
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
                    <div>
                      <div className="text-[#1B6013] font-normal mb-1">
                        {user.data.name}
                      </div>
                      <div className="text-sm text-gray-500 font-medium truncate">
                        {user.data.email}
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
  </Headroom>
  )
}

export default HeaderClient