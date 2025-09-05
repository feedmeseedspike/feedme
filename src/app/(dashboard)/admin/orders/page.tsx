export const dynamic = "force-dynamic";
import OrdersClient from "./OrdersClient";
import { fetchOrders } from "../../../../queries/orders";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; status?: string[] };
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const itemsPerPage = 10;
  const initialSearch = searchParams?.search || "";
  const initialStatus = Array.isArray(searchParams?.status)
    ? searchParams.status
    : searchParams?.status
      ? [searchParams.status]
      : [];

  // Convert initialStatus to correct enum type
  const statusEnum = [
    "Cancelled",
    "In transit",
    "order delivered",
    "order confirmed",
  ];
  const mappedStatus = (initialStatus || []).filter(
    (
      s
    ): s is
      | "Cancelled"
      | "In transit"
      | "order delivered"
      | "order confirmed" => statusEnum.includes(s)
  );

  const { data: initialOrders, count: totalOrdersCount } = await fetchOrders({
    page: currentPage,
    itemsPerPage,
    search: initialSearch,
    status: mappedStatus,
  });

  // Fix shipping_address and users for type safety and UI
  const mappedOrders = (initialOrders || []).map((order: any) => ({
    ...order,
    shipping_address:
      typeof order.shipping_address === "string"
        ? (() => {
          try {
            return JSON.parse(order.shipping_address);
          } catch {
            return null;
          }
        })()
        : order.shipping_address || null,
    // Ensure profiles is forwarded for client to render display_name
    profiles: order.profiles || null,
    created_at: order.created_at ?? null,
    updated_at: order.updated_at ?? null,
    delivery_fee: order.delivery_fee ?? null,
    local_government: order.local_government ?? null,
    total_amount_paid: order.total_amount_paid ?? null,
    reference: order.reference ?? null, // Ensure reference is always present
  }));

  return (
    <OrdersClient
      initialOrders={mappedOrders}
      totalOrdersCount={totalOrdersCount || 0}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      initialSearch={initialSearch}
      initialStatus={mappedStatus}
    />
  );
}
