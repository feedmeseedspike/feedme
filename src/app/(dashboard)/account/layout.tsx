// "use client";

import React from "react";
import Link from "next/link";
import { getUser } from "src/lib/actions/auth.actions";
import LogoutButton from "@components/shared/header/LogoutButton";
import Sidebar from "@components/shared/account/sidebar";
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarProvider, SidebarTrigger } from "@components/ui/sidebar";
import { AppSidebar } from "@components/shared/account/app-sidebar";
import { UserData } from "src/types";
import Header from "@components/shared/header";
import Footer from "@components/shared/footer";

const Dashboard = async ({ children }: { children: React.ReactNode }) => {
  const userData = await getUser();
  const user: UserData = userData?.data;

  return (
    <SidebarProvider>
        {user?.role === "buyer" && <Header /> }
        <div className="flex">
          <AppSidebar user={user} />
          <main className="w-full">
            {/* <SidebarTrigger /> */}
            {children}
          </main>
        </div>
          <Footer />


      {/* <footer className="border px-4 py-2 rounded flex justify-center items-center flex-row">
        <p className="text-xs">
          © {new Date().getFullYear()} Feedme. All rights reserved.
        </p>
      </footer> */}
    </SidebarProvider>
  );
};

export default Dashboard;
