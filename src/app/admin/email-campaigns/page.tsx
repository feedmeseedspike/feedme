"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EmailCampaignsAdmin() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-6 text-center">
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl font-semibold text-[#1B6013]">
          Email Campaigns
        </h1>
        <p className="text-slate-600">
          The legacy email campaign builder has been replaced. Use the dedicated
          price update dashboard to upload price sheets, manage subscribers, and
          send alerts to customers.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild className="bg-[#1B6013] hover:bg-[#1B6013]/90">
            <Link href="/admin/email-campaigns/price-updates">
              Open Price Update Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
