export const dynamic = "force-dynamic";
import OrdersClient from "./OrdersClient";
import { fetchOrders } from "../../../../queries/orders";
import { Database } from "../../../../utils/database.types";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const itemsPerPage = 10;
  const initialSearch = (typeof searchParams?.search === 'string' ? searchParams.search : "") || "";
  
  // Helper to normalize array params
  const getArrayParam = (param: string | string[] | undefined) => {
    if (!param) return [];
    return Array.isArray(param) ? param : [param];
  };

  const initialStatus = getArrayParam(searchParams?.status);
  const initialPaymentStatus = getArrayParam(searchParams?.paymentStatus);
  const initialPaymentMethod = getArrayParam(searchParams?.paymentMethod);
  const startDate = typeof searchParams?.startDate === 'string' ? searchParams.startDate : undefined;
  const endDate = typeof searchParams?.endDate === 'string' ? searchParams.endDate : undefined;

  // Convert initialStatus to correct enum type (validation)
  const statusEnum = [
    "Cancelled",
    "In transit",
    "order delivered",
    "order confirmed",
  ];
  const mappedStatus = initialStatus.filter(
    (s): s is
      | "Cancelled"
      | "In transit"
      | "order delivered"
      | "order confirmed" => statusEnum.includes(s)
  );

  // Cast payment status
  const mappedPaymentStatus = initialPaymentStatus as Database["public"]["Enums"]["payment_status_enum"][];

  const { data: initialOrders, count: totalOrdersCount } = await fetchOrders({
    page: currentPage,
    itemsPerPage,
    search: initialSearch,
    status: mappedStatus,
    paymentStatus: mappedPaymentStatus,
    paymentMethod: initialPaymentMethod,
    startDate,
    endDate,
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
    users: order.users || { display_name: "Unknown User" },
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
      initialPaymentStatus={mappedPaymentStatus}
      initialPaymentMethod={initialPaymentMethod}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  );
}
