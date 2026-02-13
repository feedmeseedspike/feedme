import AdminNotificationsClient from "./AdminNotificationsClient";

export const metadata = {
  title: "Push Notifications | Admin Dashboard",
  description: "Send broadcast notifications to all FeedMe users.",
};

export default function AdminNotificationsPage() {
  return (
    <div className="container mx-auto py-6">
      <AdminNotificationsClient />
    </div>
  );
}
