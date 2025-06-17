"use client";

import React, { useEffect, useState } from "react";
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
import { TypedSupabaseClient } from "src/utils/types";
import { getAllCategoriesQuery } from "src/queries/categories";
import { createClient } from "src/utils/supabase/client";
import { toSlug } from "src/lib/utils";
// import { Tables } from "@utils/database.types";

type CategoryListItem = {
  id: string;
  title: string;
  thumbnail: string | object | null; // thumbnail can be object (Json) or string (url)
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

const Footer = () => {
  const year = new Date().getFullYear();
  const [categories, setCategories] = useState<CategoryListItem[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const fetchCategories = async () => {
      const { data, error } = await getAllCategoriesQuery(supabase).select(
        "id, title, thumbnail"
      );
      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data || []);
      }
    };
    fetchCategories();
  }, []);

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
                src="/footerlogo.png"
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
                    {categories.map((category) => (
                      <li key={category.id} className="text-sm">
                        <Link
                          href={`/category/${toSlug(category?.title)}`}
                          className="hover:underline hover:underline-offset-2"
                        >
                          {category.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href="/categories">
                    <button className="mt-4 text-orange-600 hover:underline">
                      See More
                    </button>
                  </Link>
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
};

export default Footer;
