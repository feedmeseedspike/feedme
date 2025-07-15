export const dynamic = "force-dynamic";
import { getUser } from "src/lib/actions/auth.actions";
import { fetchUserOrders } from "src/queries/orders";
import OrderClient from "./OrderClient";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const user = await getUser();
  const currentPage = Number(searchParams?.page) || 1;
  const ordersPerPage = 5;

  let orders: any[] = [];
  let totalOrdersCount = 0;
  let fetchError = null;

  if (user?.user_id) {
    try {
      const { data, count } = await fetchUserOrders(
        user.user_id,
        currentPage,
        ordersPerPage
      );
      orders = data;

      console.log(orders);
      totalOrdersCount = count ?? 0;
    } catch (error) {
      console.error("Error fetching user orders:", error);
      fetchError = error;
    }
  }

  return (
    <OrderClient
      orders={orders}
      totalOrdersCount={totalOrdersCount}
      ordersPerPage={ordersPerPage}
      currentPage={currentPage}
      fetchError={fetchError}
    />
  );
}
