// "use client";

import React from "react";
import { getUser } from "src/lib/actions/auth.actions";
import { SidebarProvider } from "@components/ui/sidebar";
import { AdminSidebar } from "@components/admin/adminSidebar";
import { redirect } from "next/navigation";
import { GetUserReturn } from "src/lib/actions/auth.actions";

const Dashboard = async ({ children }: { children: React.ReactNode }) => {
  const user: GetUserReturn = await getUser();

  // Redirect if not logged in
  if (!user) {
    redirect("/login?callbackUrl=/admin/overview");
  }

  // Redirect if not admin
  if (user && user.role !== "admin") {
    redirect("/");
  }

  return (
    <SidebarProvider>
      {/* <Container className=""> */}
      {/* {user?.role === "admin" ? ( */}
      <>
        <div
          className={`flex 
          `}
        >
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
