import React from "react";
import Link from "next/link";
import { getUser } from "src/lib/actions/auth.actions";
import LogoutButton from "@components/shared/header/LogoutButton";
import Sidebar from "@components/shared/account/sidebar";
import { SidebarProvider, SidebarTrigger } from "@components/ui/sidebar";
import AppSidebar from "@components/shared/account/app-sidebar";
import { UserData } from "src/types";
import Header from "@components/shared/header";
import Footer from "@components/shared/footer";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import Container from "@components/shared/Container";
import { redirect } from "next/navigation";
import { createClient } from "@utils/supabase/server";
import ProfileDropdown from "@components/shared/account/profile-dropdown";

const Dashboard = async ({ children }: { children: React.ReactNode }) => {
  const userData = await getUser();

  if (!userData) {
    redirect("/login?callbackUrl=/account");
  }

  return (
    <SidebarProvider>
      <div className="bg-[#F9FAFB]">
        <Header />
        <Container className="py-4 bg-white">
          <CustomBreadcrumb />
        </Container>
        <Container className="flex flex-col lg:flex-row">
          <div className="hidden lg:block">
            <AppSidebar user={userData} />
          </div>
          <ProfileDropdown user={userData} />
          <main className="w-full md:px-4">{children}</main>
        </Container>
        <Footer />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
