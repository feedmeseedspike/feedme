import Container from "@components/shared/Container";
import {
  TiSocialTwitter,
  TiSocialFacebook,
  TiSocialLinkedin,
} from "react-icons/ti";
import { SlSocialInstagram } from "react-icons/sl";
import Image from "next/image";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";

const socialLinks = [
  {
    name: "Twitter",
    icon: <TiSocialTwitter className="text-2xl" />,
    href: "https://x.com/Seedspike15427",
    color: "hover:text-blue-400",
  },
  {
    name: "Facebook",
    icon: <TiSocialFacebook className="text-2xl" />,
    href: "https://www.facebook.com/profile.php?id=100093243737297&mibextid=ZbWKwL",
    color: "hover:text-blue-600",
  },
  {
    name: "LinkedIn",
    icon: <TiSocialLinkedin className="text-2xl" />,
    href: "https://www.linkedin.com/company/seedspike/",
    color: "hover:text-blue-700",
  },
  {
    name: "Instagram",
    icon: <SlSocialInstagram className="text-2xl" />,
    href: "https://www.instagram.com/seedspikeafrica/profilecard/?igsh=MTE4OW5zY2RjYnprYQ==",
    color: "hover:text-pink-600",
  },
];

export default function CommunityPage() {
  return (
    <Container>
      <div className="py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Join Our Community</h1>
          <p className="text-[#475467] max-w-2xl mx-auto">
            Connect with fellow food enthusiasts, share experiences, and stay
            updated with the latest in fresh food delivery.
          </p>
        </div>

        {/* Social Media Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-center">
            Connect With Us
          </h2>
          <div className="flex justify-center gap-8">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className={`text-[#475467] transition-colors ${social.color}`}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <Separator className="my-12" />

        {/* Community Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-[#F9FAFB] rounded-lg">
            <h3 className="font-semibold mb-3">Share Your Experience</h3>
            <p className="text-[#475467]">
              Share your food journey and connect with other food lovers in our
              community.
            </p>
          </div>
          <div className="text-center p-6 bg-[#F9FAFB] rounded-lg">
            <h3 className="font-semibold mb-3">Stay Updated</h3>
            <p className="text-[#475467]">
              Get the latest updates on new products, promotions, and community
              events.
            </p>
          </div>
          <div className="text-center p-6 bg-[#F9FAFB] rounded-lg">
            <h3 className="font-semibold mb-3">Join Discussions</h3>
            <p className="text-[#475467]">
              Participate in discussions about food, recipes, and sustainable
              living.
            </p>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-[#F9FAFB] p-8 rounded-lg text-center">
          <h2 className="text-2xl font-semibold mb-4">Stay Connected</h2>
          <p className="text-[#475467] mb-6">
            Subscribe to our newsletter for exclusive updates and community
            news.
          </p>
          <div className="max-w-md mx-auto">
            <Button className="w-full">Subscribe to Newsletter</Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
