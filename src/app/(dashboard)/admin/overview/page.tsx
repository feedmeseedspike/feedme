import { createClient } from "@utils/supabase/server";
import OverviewClient, { Order } from "./OverviewClient";
import { getTodaysBirthdaysAction } from "src/lib/actions/user.action";

export const dynamic = "force-dynamic";

export const revalidate = 0;

export default async function OverviewPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select("*");
  if (error) {
    console.error("Error fetching orders:", error);
    return <div>Error loading data. Please try again later.</div>;
  }
  const initialOrders: Order[] = (data || []).map((order: any) => ({
    ...order,
    shipping_address:
      typeof order.shipping_address === "string"
        ? JSON.parse(order.shipping_address)
        : order.shipping_address,
  }));

  // Fetch only the metrics needed for the charts
  const [
    totalOrdersRes,
    confirmedOrdersRes,
    deliveredOrdersRes,
    totalRevenueRes,
    totalProductsRes,
    totalCustomersRes,
    totalCategoriesRes,
    todaysBirthdaysRes,
  ] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "order confirmed"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "order delivered"),
    supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "order delivered"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("user_id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    getTodaysBirthdaysAction(), // Fetch today's birthdays
  ]);

  if (
    totalOrdersRes.error ||
    confirmedOrdersRes.error ||
    deliveredOrdersRes.error ||
    totalRevenueRes.error ||
    totalProductsRes.error ||
    totalCustomersRes.error ||
    totalCategoriesRes.error
  ) {
    return <div>Error loading dashboard metrics. Please try again later.</div>;
  }

  // Calculate total revenue
  const totalRevenue = (totalRevenueRes.data || []).reduce(
    (sum, row) => sum + (row.total_amount || 0),
    0
  );

  const todaysBirthdays = todaysBirthdaysRes.success ? todaysBirthdaysRes.data : [];

  return (
    <OverviewClient
      initialOrders={initialOrders}
      totalOrders={totalOrdersRes.count || 0}
      confirmedOrders={confirmedOrdersRes.count || 0}
      deliveredOrders={deliveredOrdersRes.count || 0}
      totalRevenue={totalRevenue}
      totalProducts={totalProductsRes.count || 0}
      totalCustomers={totalCustomersRes.count || 0}
      totalCategories={totalCategoriesRes.count || 0}
      todaysBirthdays={todaysBirthdays}
    />
  );
}
