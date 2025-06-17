// "use client";

import React from "react";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { getUser } from "src/lib/actions/auth.actions";
import LogoutButton from "@components/shared/header/LogoutButton";
import Sidebar from "@components/shared/account/sidebar";
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarProvider, SidebarTrigger } from "@components/ui/sidebar";
import { AppSidebar } from "@components/shared/account/app-sidebar";
import { UserData } from "src/types";
import Container from "@components/shared/Container";
import { AdminSidebar } from "@components/admin/adminSidebar";

// const poppins = Poppins({ weight: [`100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`] });

const Dashboard = async ({ children }: { children: React.ReactNode }) => {
  const user: UserData = await getUser();
  // console.log(user)

  return (
    <SidebarProvider>
      {/* <Container className=""> */}
        {/* {user?.role === "admin" ? ( */}
          <>
          <div className={`flex 
          `}>
            {/* ${poppins.className} */}
            <AdminSidebar user={user} />
            <main className="w-full px-2 sm:px-4 md:px-6 py-10">
              {/* <SidebarTrigger /> */}
              {children}
            </main>
          </div>
          </>

        {/* ) : <p className="">You are not autorized to access this page </p> } */}

      {/* </Container> */}


      {/* <footer className="border px-4 py-2 rounded flex justify-center items-center flex-row">
        <p className="text-xs">
          © {new Date().getFullYear()} Feedme. All rights reserved.
        </p>
      </footer> */}
    </SidebarProvider>
  );
};

export default Dashboard;
