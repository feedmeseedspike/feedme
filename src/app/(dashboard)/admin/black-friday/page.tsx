import { Metadata } from "next";
import BlackFridayManager from "@components/admin/black-friday/BlackFridayManager";

export const metadata: Metadata = {
  title: "Black Friday Manager | FeedMe Admin",
  description: "Configure Black Friday offers.",
};

export const dynamic = "force-dynamic";

export default function BlackFridayAdminPage() {
  return (
    <div className="container mx-auto py-8">
      <BlackFridayManager />
    </div>
  );
}



