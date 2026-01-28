import { createClient } from "@utils/supabase/client";
import { Database, Json } from "../utils/database.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatError } from "src/lib/utils";
import { issueReferrerDiscount } from "src/lib/actions/referrer.actions";

interface FetchOrdersParams {
  page?: number;
  itemsPerPage?: number;
  search?: string;
  status?: Database['public']['Enums']['order_status_enum'][];
  paymentStatus?: Database['public']['Enums']['payment_status_enum'][];
  paymentMethod?: string[];
  startDate?: string;
  endDate?: string;
}

interface AddPurchaseBody {
  userId: string;
  cartItems: Array<{ productId: string; quantity: number; option?: Json; price?: number | null; bundleId?: string; offerId?: string }>;
  shippingAddress: Json | null;
  totalAmount: number;
  totalAmountPaid: number;
  deliveryFee: number;
  local_government: string;
  voucherId?: string | null;
  paymentMethod: string;
  note?: string;
}

export async function fetchOrders({
  page = 1,
  itemsPerPage = 10,
  search = "",
  status = [],
  paymentStatus = [],
  paymentMethod = [],
  startDate,
  endDate,
}: FetchOrdersParams) {
  const supabase = createClient();
  const offset = (page - 1) * itemsPerPage;

  let userIds: string[] = [];
  // If searching, find user_ids whose display_name matches
  if (search) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("display_name", `%${search}%`);
    if (profileData) {
      userIds = profileData.map((p: any) => p.user_id);
    }
  }

  let query = supabase
    .from("orders")
    .select("*, profiles:user_id(display_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + itemsPerPage - 1);

  // Main search: order id, payment_method, status
  if (search) {
    const orParts = [
      `id.ilike.%${search}%`,
      `reference.ilike.%${search}%`,
      `payment_method.ilike.%${search}%`,
      `status.ilike.%${search}%`,
    ];
    if (userIds.length > 0) {
      orParts.push(`user_id.in.(${userIds.join(",")})`);
    }
    query = query.or(orParts.join(","));
  }
  if (status && status.length > 0) {
    query = query.in("status", status);
  }
  if (paymentStatus && paymentStatus.length > 0) {
    query = query.in("payment_status", paymentStatus);
  }
  if (paymentMethod && paymentMethod.length > 0) {
    query = query.in("payment_method", paymentMethod);
  }
  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { data, count };
}

export async function fetchOrderById(orderId: string) {
  console.log("fetchOrderById START", orderId);
  const supabase = createClient();
  
  // 1. Fetch Order
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, profiles:user_id(display_name)")
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("fetchOrderById Error fetching order:", error);
    throw error;
  }
  if (!order) {
    console.error("fetchOrderById Order not found");
    return null;
  }

  // 2. Fetch Items
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemsError) {
    console.error("fetchOrderById Error fetching items:", itemsError);
    throw itemsError;
  }

  if (!items || items.length === 0) {
    console.log("fetchOrderById No items found, returning early");
    return { ...order, order_items: [] };
  }

  // 3. Collect IDs
  console.log("fetchOrderById Processing items:", items.length);
  const productIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))];
  const bundleIds = [...new Set(items.map((i: any) => i.bundle_id).filter(Boolean))];
  const offerIds = [...new Set(items.map((i: any) => i.offer_id).filter(Boolean))];

  // 4. Batch Fetch Details
  let products: any[] = [];
  let bundles: any[] = [];
  let offers: any[] = [];

  if (productIds.length > 0) {
    const { data } = await supabase.from("products").select("id, name, images").in("id", productIds);
    products = data || [];
  }
  
  if (bundleIds.length > 0) {
    const { data } = await supabase.from("bundles").select("id, name, thumbnail_url").in("id", bundleIds);
    bundles = data || [];
  }

  if (offerIds.length > 0) {
    const { data } = await supabase.from("offers").select("id, title, image_url").in("id", offerIds);
    offers = data || [];
  }

  // 5. Map details back to items
  const enrichedItems = items.map((item: any) => ({
    ...item,
    products: item.product_id ? products.find(p => p.id === item.product_id) : null,
    bundles: item.bundle_id ? bundles.find(b => b.id === item.bundle_id) : null,
    offers: item.offer_id ? offers.find(o => o.id === item.offer_id) : null,
  }));

  // 6. Fetch Voucher Details if exists
  let voucherData = null;
  if (order.voucher_id) {
    const { data: v } = await supabase.from("vouchers").select("*").eq("id", order.voucher_id).single();
    voucherData = v;
  }

  console.log("fetchOrderById END success");
  return { ...order, order_items: enrichedItems, vouchers: voucherData };
}

export async function fetchUserOrders(
  userId: string,
  page: number = 1,
  itemsPerPage: number = 5
) {
  const supabase = createClient();
  
  console.log("Running fetchUserOrders - Manual enrichment version");
  
  // 1. Fetch Orders
  let query = supabase
    .from("orders")
    .select(
      `
      *,
      profiles:user_id(display_name)
    `, { count: 'exact' }
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Apply pagination
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;
  query = query.range(start, end);

  const { data: orders, error, count } = await query;

  if (error) {
    throw error;
  }

  // 2. Enrich orders with items (Manual Fetch to bypass schema cache issues)
  const enrichedOrders = await Promise.all(
    (orders || []).map(async (order: any) => {
      // Fetch items for this order
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);
      
      if (!items) return { ...order, order_items: [] };

      // Enrich items with product/bundle/offer details
      const enrichedItems = await Promise.all(
        items.map(async (item: any) => {
           let product = null;
           let bundle = null;
           let offer = null;

           if (item.product_id) {
             const { data: p } = await supabase
               .from("products")
               .select("name, images")
               .eq("id", item.product_id)
               .single();
             product = p;
           }
           
           if (item.bundle_id) {
             const { data: b } = await supabase
               .from("bundles")
               .select("name, thumbnail_url")
               .eq("id", item.bundle_id)
               .single();
             bundle = b;
           }

           if (item.offer_id) {
             const { data: o } = await supabase
               .from("offers")
               .select("title, image_url")
               .eq("id", item.offer_id)
               .single();
             offer = o;
           }

           return {
             ...item,
             products: product,
             bundles: bundle,
             offers: offer
           };
        })
      );

      return { ...order, order_items: enrichedItems };
    })
  );

  return { data: enrichedOrders, count };
}

export async function addPurchase(body: AddPurchaseBody) {
  const supabase = createClient();

  const { data: { user: authenticatedUser } } = await supabase.auth.getUser();
  // Allow anonymous orders - do not return error if !authenticatedUser
  // if (authError || !authenticatedUser) {
  //   return { success: false, error: 'Authentication required to place an order.' };
  // }

  try {
    // --- VOUCHER USAGE COUNT PATCH ---
    let voucherToUse: Database['public']['Tables']['vouchers']['Row'] | null = null;
    if (body.voucherId) {
      // Fetch the voucher row
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .select('*')
        .eq('id', body.voucherId)
        .single();
      if (voucherError || !voucher) {
        return { success: false, error: 'Voucher not found or invalid.' };
      }
      // Check usage limit
      if (voucher.max_uses !== null && (voucher.used_count || 0) >= voucher.max_uses) {
        return { success: false, error: 'Voucher has reached its maximum uses.' };
      }
      voucherToUse = voucher;
    }

    // --- GENERATE REFERENCE CODE ---
    const reference = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // --- CREATE ORDER ---
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      user_id: body.userId,
      payment_method: body.paymentMethod,
      shipping_address: body.shippingAddress,
      total_amount: body.totalAmount,
      status: 'order confirmed',
      payment_status: body.paymentMethod === 'wallet' ? 'Paid' : 'Pending',
      voucher_id: body.voucherId,
      reference: reference, // Add reference
      note: body.note,
    }).select().single();

    if (orderError) throw orderError;
    if (!order) throw new Error("Failed to create order.");

    const orderItemsToInsert = body.cartItems.map(item => ({
      order_id: order.id,
      product_id: item.productId || null,
      bundle_id: item.bundleId || null,
      offer_id: item.offerId || null,
      quantity: item.quantity,
      price: item.price,
      option: item.option || null,
    }));

    const { error: orderItemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
    if (orderItemsError) throw orderItemsError;

    // --- ATOMICALLY INCREMENT VOUCHER USAGE ---
    if (voucherToUse) {
      const { error: voucherUpdateError } = await supabase
        .from('vouchers')
        .update({ used_count: (voucherToUse.used_count || 0) + 1 })
        .eq('id', voucherToUse.id)
        .eq('used_count', voucherToUse.used_count || 0); // Optimistic concurrency
      if (voucherUpdateError) {
        return { success: false, error: 'Failed to update voucher usage. Please try again.' };
      }
      // Insert into voucher_usages for per-user tracking
      const { error: usageInsertError } = await supabase
        .from('voucher_usages')
        .insert({ user_id: body.userId, voucher_id: voucherToUse.id });
      if (usageInsertError) {
        return { success: false, error: 'Failed to record voucher usage. Please try again.' };
      }
    }

    // --- REFERRAL PATCH: Mark referred_discount_given after successful order ---
    const { data: referral, error: referralFetchError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', body.userId)
      .eq('status', 'applied')
      .maybeSingle();

    if (referralFetchError) {
      // Continue processing, as referral tracking is secondary to order completion
    }

    if (referral) {
      const newReferredPurchaseAmount = (referral.referred_purchase_amount || 0) + body.totalAmount;
      const updateData: Partial<Database['public']['Tables']['referrals']['Update']> = {
        referred_purchase_amount: newReferredPurchaseAmount,
        updated_at: new Date().toISOString(),
      };
      let newStatus = referral.status;
      // If this order used a referral voucher, mark as completed
      if (voucherToUse && voucherToUse.code.startsWith('REF-') && !referral.referred_discount_given) {
        updateData.referred_discount_given = true;
        updateData.status = 'completed';
        newStatus = 'completed';
      }
      // If purchase amount qualifies for referrer reward
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
      }
      const { error: updateError } = await supabase
        .from('referrals')
        .update(updateData)
        .eq('id', referral.id);
    }

    return { success: true, data: { orderId: order.id, reference: order.reference } };
  } catch (error: any) {
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
    throw error;
  }

  return count || 0;
}

// Fetch count of unviewed orders for admin notification badge
export async function getUnviewedOrdersCount() {
  // Temporarily disabled due to missing admin_viewed column
  return 0;
  
  // const supabase = createClient();
  // const { count, error } = await supabase
  //   .from('orders')
  //   .select('id', { count: 'exact' })
  //   .eq('admin_viewed', false);
  // if (error) throw error;
  // return count || 0;
}

// Mark orders as viewed (by ID or all)
export async function markOrdersAsViewed(orderIds?: string[]) {
  // Temporarily disabled due to missing admin_viewed column
  return true;
  
  // const supabase = createClient();
  // let query = supabase.from('orders').update({ admin_viewed: true });
  // if (orderIds && orderIds.length > 0) {
  //   query = query.in('id', orderIds);
  // }
  // const { error } = await query;
  // if (error) throw error;
  // return true;
} 