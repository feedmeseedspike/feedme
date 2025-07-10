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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Sparkles } from "lucide-react";
import FooterClient from "./FooterClient";

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

function ComingSoonModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs w-full text-center">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <Sparkles className="text-yellow-500 w-10 h-10" />
          </div>
          <DialogTitle className="text-2xl font-bold mb-2">
            Coming Soon!
          </DialogTitle>
        </DialogHeader>
        <div className="mb-4 text-gray-600">
          This page or feature is coming soon. Stay tuned!
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-[#1B6013] text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

  return <FooterClient year={year} categories={categories} error={error} />;
}
