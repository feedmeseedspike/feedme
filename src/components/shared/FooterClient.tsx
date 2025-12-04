"use client";
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
import { EmailModal } from "@components/shared/EmailModal";
import { toSlug } from "src/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

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
      { name: "Send An Email", isEmailModal: true },
    ],
  },
  {
    title: "Business",
    links: [
      { name: "Become A Vendor", href: "/" },
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

const securityBadges = [
  {
    id: "paystack",
    label: "Paystack Secure",
    description: "PCI-DSS Level 1",
    icon: "mdi:credit-card-check-outline",
  },
  {
    id: "son",
    label: "SON Certified",
    description: "Standards Org. of Nigeria",
    icon: "mdi:shield-check",
  },
  {
    id: "nafdac",
    label: "NAFDAC Verified",
    description: "Safe food partners",
    icon: "mdi:certificate-outline",
  },
  {
    id: "delivery",
    label: "Insured Deliveries",
    description: "Trusted logistics partners",
    icon: "mdi:truck-fast-outline",
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

type CategoryListItem = {
  id: string;
  title: string;
  thumbnail: any;
};

export default function FooterClient({
  year,
  categories,
  error,
}: {
  year: number;
  categories: CategoryListItem[];
  error: string | null;
}) {
  const [comingSoonOpen, setComingSoonOpen] = React.useState(false);

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
                        .map((category, index) => (
                          <motion.li
                            key={category.id}
                            className="text-sm"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                          >
                            <Link
                              href={`/category/${toSlug(category?.title)}`}
                              className="relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#1B6013] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65,0.05,0.36,1)] hover:after:origin-bottom-left hover:after:scale-x-100 w-fit"
                            >
                              {category.title}
                            </Link>
                          </motion.li>
                        ))
                    )}
                  </ul>
                </div>
                {footerData.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <h3 className="font-semibold text-[#101828] mb-4 uppercase text-sm">
                      {section.title}
                    </h3>
                    <ul className="space-y-2">
                      {section.links.map((link, linkIndex) => (
                        <motion.li
                          key={linkIndex}
                          className="text-sm"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: index * 0.1 + linkIndex * 0.05,
                            duration: 0.3,
                          }}
                        >
                          {"isModal" in link && link.isModal ? (
                            <ContactModal />
                          ) : "isEmailModal" in link && link.isEmailModal ? (
                            <EmailModal />
                          ) : "href" in link && link.href === "/" ? (
                            <>
                              <button
                                type="button"
                                className="relative inline-block text-left bg-transparent border-none p-0 m-0 text-inherit cursor-pointer after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#1B6013] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65,0.05,0.36,1)] hover:after:origin-bottom-left hover:after:scale-x-100"
                                onClick={() => setComingSoonOpen(true)}
                              >
                                {link.name}
                              </button>
                              <ComingSoonModal
                                open={comingSoonOpen}
                                onOpenChange={setComingSoonOpen}
                              />
                            </>
                          ) : (
                            <a
                              href={"href" in link ? link.href : "/"}
                              className="relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#1B6013] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65,0.05,0.36,1)] hover:after:origin-bottom-left hover:after:scale-x-100"
                            >
                              {link.name}
                            </a>
                          )}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
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
              {Icons.map((icon, index) => (
                <motion.a
                  href={icon.href}
                  target="_blank"
                  rel="noreferrer"
                  key={icon.href}
                  className="text-2xl transition-colors duration-300 hover:text-[#1B6013] relative group"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{
                    scale: 1.2,
                    y: -2,
                    transition: {
                      duration: 0.2,
                      type: "spring",
                      stiffness: 400,
                    },
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#1B6013]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"
                    initial={false}
                  />

                  <motion.div
                    whileHover={{
                      rotate: [0, -10, 10, 0],
                      transition: { duration: 0.4 },
                    }}
                    className="relative z-10"
                  >
                    {icon.icon}
                  </motion.div>
                </motion.a>
              ))}
            </div>
          </div>
        </footer>
      </Container>
    </>
  );
}
