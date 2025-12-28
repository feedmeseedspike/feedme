import { getStoreSettings } from "@/lib/actions/settings.actions";
import SettingsForm from "./settings-form";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getStoreSettings();

  const defaultValues = settings || {
    open_time: "08:00",
    close_time: "18:00",
    closed_days: [],
    accept_orders_when_closed: true,
    is_store_enabled: true
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your store's operating hours and availability
        </p>
      </div>
      
      <SettingsForm defaultValues={defaultValues} />
    </div>
  );
}
