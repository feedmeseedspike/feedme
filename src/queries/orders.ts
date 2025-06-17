import { createClient } from "@utils/supabase/client";
import { Database } from "../utils/database.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatError } from "src/lib/utils";

interface FetchOrdersParams {
  page?: number;
  itemsPerPage?: number;
  search?: string;
  status?: Database['public']['Enums']['order_status_enum'][];
}

interface AddPurchaseBody {
  userId: string;
  cartItems: Array<{ productId: string; quantity: number; option?: any; price?: number | null; bundleId?: string }>;
  shippingAddress: any; // Use more specific type if available
  totalAmount: number;
  totalAmountPaid: number;
  deliveryFee: number;
  local_government: string;
  voucherId?: string | null;
  paymentMethod: string;
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
    users ( display_name )
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

export async function fetchOrderById(orderId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      users(display_name),
      order_items(*,
        products(name, images),
        bundles(name, thumbnail_url)
      )
    `
    )
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Error fetching order by ID:", error);
    throw error;
  }

  return data;
}

export async function fetchUserOrders(
  userId: string,
  page: number = 1,
  itemsPerPage: number = 5
) {
  const supabase = createClient();
  
  let query = supabase
    .from("orders")
    .select(
      `
      *,
      users(display_name),
      order_items(*)
    `, { count: 'exact' } // Request exact count
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Apply pagination
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;
  query = query.range(start, end);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }

  return { data, count };
}

export async function addPurchase(body: AddPurchaseBody) {
  const supabase = createClient();

  const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authenticatedUser) {
    return { success: false, error: 'Authentication required to place an order.' };
  }

  try {
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      user_id: body.userId,
      payment_method: body.paymentMethod,
      shipping_address: body.shippingAddress,
      total_amount: body.totalAmount,
      status: 'order confirmed', 
      payment_status: body.paymentMethod === 'wallet' ? 'Paid' : 'Pending',
      voucher_id: body.voucherId,
    }).select().single();

    if (orderError) throw orderError;
    if (!order) throw new Error("Failed to create order.");

    const orderItemsToInsert = body.cartItems.map(item => ({
      order_id: order.id,
      product_id: item.productId || null, 
      bundle_id: item.bundleId || null,
      quantity: item.quantity,
      price: item.price,
      option: item.option || null,
      // You might need to add vendor_id here if it's part of your schema for order_items
    }));

    const { error: orderItemsError } = await supabase.from('order_items').insert(orderItemsToInsert);

    if (orderItemsError) throw orderItemsError;

    // After a successful order, check for referral and update purchase amount
    const { data: referral, error: referralFetchError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', body.userId)
      .eq('status', 'applied')
      .maybeSingle();

    if (referralFetchError) {
      console.error("Error fetching referral during purchase tracking:", referralFetchError);
      // Continue processing, as referral tracking is secondary to order completion
    }

    if (referral) {
      const newReferredPurchaseAmount = (referral.referred_purchase_amount || 0) + body.totalAmount;

      const updateData: Partial<Database['public']['Tables']['referrals']['Update']> = {
        referred_purchase_amount: newReferredPurchaseAmount,
        updated_at: new Date().toISOString(),
      };

      let newStatus = referral.status;
      if (newReferredPurchaseAmount >= 5000 && referral.status === 'applied') {
        newStatus = 'qualified';
        updateData.status = newStatus;

        // Trigger the referrer discount
        const referrerDiscountResult = await issueReferrerDiscount({
          referrerUserId: referral.referrer_user_id,
          referrerEmail: referral.referrer_email,
          referralId: referral.id,
          discountAmount: 2000, // ₦2,000 discount for the referrer
        });

        if (!referrerDiscountResult.success) {
          console.error("Failed to issue referrer discount:", referrerDiscountResult.error);
          // Log this, but don't block the order. A separate system might re-attempt or alert.
        } else {
          console.log("Referrer discount issued successfully for referral:", referral.id);
        }
      }

      const { error: updateError } = await supabase
        .from('referrals')
        .update(updateData)
        .eq('id', referral.id);

      if (updateError) {
        console.error("Error updating referral purchase amount:", updateError);
      }
    }

    return { success: true, data: { orderId: order.id } };

  } catch (error: any) {
    console.error('Error in addPurchase:', error);
    return { success: false, error: formatError(error.message) };
  }
}

export const useAddPurchaseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addPurchase,
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['cart'] }); // Invalidate cart after successful order
      }
    },
  });
};

export async function fetchPendingOrdersCount(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "order confirmed"); // Assuming 'order confirmed' is the pending status

  if (error) {
    console.error("Error fetching pending orders count:", error);
    throw error;
  }

  return count || 0;
} 