// "use client";

import React, { useEffect, useState } from "react";
// import Down from "../icons/Down";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FcDown } from "react-icons/fc";

type SidebarSection = {
  title: string;
  links: { label: string; href: string }[];
};

const getSidebarSections = (role: string | undefined): SidebarSection[] => {
  if (role === "buyer") {
    return [
      {
        title: "My Profile",
        links: [
          { label: "View Profile", href: "/dashboard/buyer/my-profile" },
          { label: "View Purchases", href: "/dashboard/buyer/my-purchases" },
        ],
      },
      {
        title: "My Cart",
        links: [
          { label: "View Cart", href: "/dashboard/buyer/my-cart" },
          { label: "View Wishlist", href: "/dashboard/buyer/my-wishlist" },
        ],
      },
      {
        title: "My Reviews",
        links: [{ label: "View Reviews", href: "/dashboard/buyer/my-reviews" }],
      },
    ];
  }
  if (role === "seller") {
    return [
      {
        title: "My Profile",
        links: [
          { label: "View Profile", href: "/dashboard/seller/my-profile" },
        ],
      },
      {
        title: "My Assets",
        links: [
          { label: "View brand", href: "/dashboard/seller/my-brand" },
          { label: "View Category", href: "/dashboard/seller/my-category" },
          { label: "View Store", href: "/dashboard/seller/my-store" },
        ],
      },
      {
        title: "My Products",
        links: [
          { label: "Add Product", href: "/dashboard/seller/add-product" },
          { label: "List Products", href: "/dashboard/seller/list-products" },
        ],
      },
    ];
  }
  return [];
};

const Sidebar = () => {
  const pathname = usePathname();
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Replace with your actual user role fetching logic
    // For now, try to get from localStorage or API
    const userData =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setRole(user.role);
      } catch {
        setRole(undefined);
      }
    }
  }, []);

  const sections = getSidebarSections(role);

  return (
    <section className="md:col-span-4 col-span-12 overflow-hidden bg-white z-50 min-w-full max-w-lg px-2 overflow-y-auto md:block hidden">
      <div className="w-full h-full flex flex-col gap-y-4">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="bg-slate-50/50 p-2 rounded flex flex-col gap-y-2"
          >
            <h2 className="flex flex-row justify-between items-center">
              {section.title} <FcDown />
            </h2>
            <div className="flex flex-col gap-y-2 text-sm p-2 bg-slate-100/50 rounded">
              {section.links.map((link, lidx) => (
                <Link
                  href={link.href}
                  key={lidx}
                  className={
                    "p-1 rounded flex flex-row gap-x-2" +
                    " " +
                    (pathname === link.href
                      ? "bg-custom-green text-white"
                      : "bg-slate-200/50 text-black")
                  }
                >
                  <span></span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <Link
          href="/"
          className="text-sm bg-slate-50/50 p-2 rounded mt-auto flex flex-row gap-x-1 items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          Go to Home
        </Link>
      </div>
    </section>
  );
};

export default Sidebar;
