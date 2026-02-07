"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Percent, Newspaper, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function EmailCampaignsPage() {
  const campaigns = [
    {
      title: "Price Update Automation",
      description: "Automatically send emails to customers when product prices change in your CSV uploads.",
      icon: Mail,
      href: "/admin/email-campaigns/price-updates",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Newsletter Campaigns",
      description: "Send monthly or weekly updates with featured products, blog posts, and company news.",
      icon: Newspaper,
      href: "/admin/email-campaigns/newsletter",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Promotional Campaigns",
      description: "Send special discount offers, flash sales, and seasonal promotions to your customers.",
      icon: Percent,
      href: "/admin/email-campaigns/promotional",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
        <p className="text-gray-600">Choose a campaign type to start reaching out to your customers.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((camp) => (
          <Card key={camp.title} className="hover:shadow-md transition-shadow h-full flex flex-col">
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg ${camp.bgColor} flex items-center justify-center mb-4`}>
                <camp.icon className={`w-6 h-6 ${camp.color}`} />
              </div>
              <CardTitle>{camp.title}</CardTitle>
              <CardDescription>{camp.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full bg-[#1B6013] hover:bg-[#154d0f]">
                <Link href={camp.href}>
                  Manage Campaigns <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-slate-50 border-dashed">
        <CardContent className="py-8 flex flex-col items-center text-center">
          <Mail className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold">Email Templates</h3>
          <p className="text-slate-600 mb-4 max-w-md">
            Want to customize how your emails look? Head over to the template manager to edit your designs.
          </p>
          <Button variant="outline" asChild>
            <Link href="/admin/email-templates">
              Manage Email Templates
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
