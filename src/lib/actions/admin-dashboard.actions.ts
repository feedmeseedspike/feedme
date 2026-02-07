"use server";

import supabaseAdmin from "@/utils/supabase/admin";

export async function getCustomerCartPrizesAction(customerId: string) {
  try {
    const supabase = supabaseAdmin;
    
    // 1. Get Cart ID
    const { data: cart, error: cartError } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", customerId)
      .maybeSingle();

    if (cartError || !cart) {
        if (cartError && cartError.code !== 'PGRST116') {
             console.error("Error fetching cart:", cartError);
        }
        return [];
    }

    // 2. Get Items
    const { data: items, error: itemsError } = await supabase
      .from("cart_items")
      .select(`
        *,
        product:products(name, image)
      `)
      .eq("cart_id", cart.id);

    if (itemsError) {
        console.error("Error fetching cart items:", itemsError);
        return [];
    }

    return items || [];
  } catch (error) {
    console.error("Error in getCustomerCartPrizesAction:", error);
    return [];
  }
}

export async function getCustomerLastOrderAction(customerId: string) {
  try {
    const supabase = supabaseAdmin;
    const { data, error } = await supabase
        .from("orders")
        .select("created_at, status, total_amount")
        .eq("user_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
    
    if (error) {
         // PGRST116 means 0 rows for .single(), distinct from other errors
         if (error.code !== 'PGRST116') {
             console.error("Error fetching last order:", error);
         }
         return null;
    }
    return data;
  } catch (error) {
    console.error("Error in getCustomerLastOrderAction:", error);
    return null;
  }
}

export async function getCustomerWalletBalanceAction(userId: string) {
  try {
    const supabase = supabaseAdmin;
    const { data, error } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
        console.error("Error fetching wallet balance:", error);
        return 0;
    }
    return data?.balance || 0;
  } catch (error) {
    console.error("Exception fetching wallet balance:", error);
    return 0;
  }
}

export async function getCustomerTransactionsAction(userId: string, page: number = 1, pageSize: number = 10) {
  try {
    const supabase = supabaseAdmin;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data, error, count } = await supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) {
        console.error("Error fetching transactions:", error);
        return { data: [], count: 0 };
    }
    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error("Exception fetching transactions:", error);
    return { data: [], count: 0 };
  }
}

export async function getCustomerVouchersAction(userId: string) {
  try {
    const supabase = supabaseAdmin;
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching vouchers:", error);
        return [];
    }
    return data || [];
  } catch (error) {
    console.error("Exception fetching vouchers:", error);
    return [];
  }
}
