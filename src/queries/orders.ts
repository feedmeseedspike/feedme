import { createClient } from "@utils/supabase/client";

interface FetchOrdersParams {
  page?: number;
  itemsPerPage?: number;
  search?: string;
  status?: string[];
}

export async function fetchOrders({
  page = 1,
  itemsPerPage = 5,
  search = "",
  status = [],
}: FetchOrdersParams) {
  const supabase = createClient();
  let query = supabase.from("orders").select(
    `
    *,
    users ( display_name, phone )
  `
  );

  // Apply search filter
  if (search) {
    query = query.or(
      `id.ilike.%${search}%, users.display_name.ilike.%${search}%`
    );
  }

  // Apply status filter
  if (status.length > 0) {
    query = query.in("status", status);
  }

  // Apply pagination
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;
  query = query.range(start, end);

  // Fetch data and count
  const { data, error, count } = await query.limit(itemsPerPage);

  if (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }

  return { data, count };
} 