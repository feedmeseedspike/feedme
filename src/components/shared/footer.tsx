import React from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "./Container";
import {
  TiSocialTwitter,
  TiSocialFacebook,
  TiSocialLinkedin,
} from "react-icons/ti";
import { SlSocialInstagram } from "react-icons/sl";
import Waitlist from "@components/shared/WaitList";
import { ContactModal } from "@components/shared/ContactModal";
import { getAllCategoriesQuery } from "src/queries/categories";
import { createClient } from "src/utils/supabase/server";
import { toSlug } from "src/lib/utils";
// import { useQuery } from "@tanstack/react-query";
// import { Tables } from "@utils/database.types";

type CategoryListItem = {
  id: string;
  title: string;
  thumbnail: any; // Accept any type to match the query result
};

const footerData = [
  {
    title: "Company",
    links: [
      { name: "Seedspike", href: "https://seedspikeafrica.com/" },
      { name: "Community", href: "/" },
      { name: "Press Releases", href: "/" },
      { name: "Contact", isModal: true },
      { name: "Careers (Join Us)", href: "/careers" },
    ],
  },
  {
    title: "Get Help",
    links: [
      { name: "Chat With Us", href: "/" },
      { name: "Send An Email", href: "/" },
    ],
  },
  {
    title: "Business",
    links: [
      { name: "Become A Vendor", href: "/vendor" },
      { name: "Become A Logistics Partner", href: "/" },
    ],
  },
  {
    title: "Legal",
    links: [{ name: "Privacy Policy", href: "/return-policy" }],
  },
];

const Icons = [
  { href: "https://x.com/Seedspike15427", icon: <TiSocialTwitter /> },
  {
    href: "https://www.facebook.com/profile.php?id=100093243737297&mibextid=ZbWKwL",
    icon: <TiSocialFacebook />,
  },
  {
    href: "https://www.linkedin.com/company/seedspike/",
    icon: <TiSocialLinkedin />,
  },
  {
    href: "https://www.instagram.com/seedspikeafrica/profilecard/?igsh=MTE4OW5zY2RjYnprYQ==",
    icon: <SlSocialInstagram />,
  },
];

export default async function Footer() {
  const year = new Date().getFullYear();
  const supabase = await createClient();
  let categories: CategoryListItem[] = [];
  let error: string | null = null;
  try {
    const queryBuilder = getAllCategoriesQuery(supabase);
    const { data, error: fetchError } = await queryBuilder.select("*");
    if (fetchError) throw fetchError;
    categories = (data || []) as CategoryListItem[];
  } catch (err: any) {
    error = err.message || "Failed to fetch categories";
  }

  return (
    <>
      <div className="bg-[#F9FAFB] text-[#475467] font-semibold">
        <Container>
          <Waitlist />
        </Container>
      </div>
      <Container>
        <footer className="pt-12 pb-6">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-0 justify-between text-[#475467] font-semibold">
            <div className="flex flex-col gap-6 lg:w-[30%]">
              <Image
                src="/Footerlogo.png"
                alt="logo"
                width={141}
                height={40}
                className="h-[40px] object-contain md:block cursor-pointer"
              />
              <p>Real Food, Real Fast</p>
            </div>
            <div className="lg:w-[70%]">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Categories Section */}
                <div>
                  <h3 className="font-bold mb-4 uppercase text-black text-sm">
                    Categories
                  </h3>
                  <ul className="space-y-2">
                    {error ? (
                      <li>Error loading categories.</li>
                    ) : categories.length === 0 ? (
                      <li>No categories found.</li>
                    ) : (
                      categories
                        .filter((category) => !!category.id)
                        .map((category) => (
                          <li key={category.id} className="text-sm">
                            <Link
                              href={`/category/${toSlug(category?.title)}`}
                              className="hover:underline hover:underline-offset-2"
                            >
                              {category.title}
                            </Link>
                          </li>
                        ))
                    )}
                  </ul>
                  {/* <Link href="/categories">
                    <button className="mt-4 text-orange-600 hover:underline">
                      See More
                    </button>
                  </Link> */}
                </div>
                {footerData.map((section, index) => (
                  <div key={index}>
                    <h3 className="font-semibold text-[#101828] mb-4 uppercase text-sm">
                      {section.title}
                    </h3>
                    <ul className="space-y-2">
                      {section.links.map((link, linkIndex) => (
                        <li key={linkIndex} className="text-sm">
                          {link.isModal ? (
                            <ContactModal />
                          ) : (
                            <a
                              href={link.href}
                              className="hover:underline hover:underline-offset-2"
                            >
                              {link.name}
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-16 pb-8">
            <hr />
          </div>
          <div className="pb-8 flex flex-col md:flex-row gap-6 items-center justify-between">
            <p>&copy; {year} Seedspike. All rights reserved.</p>
            <div className="flex gap-3">
              {Icons.map((icon) => (
                <a
                  href={icon.href}
                  target="_blank"
                  rel="noreferrer"
                  key={icon.href}
                  className="text-2xl hover:text-green-600 hover:transition-colors hover:ease-in-out"
                >
                  {icon.icon}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </Container>
    </>
  );
}
