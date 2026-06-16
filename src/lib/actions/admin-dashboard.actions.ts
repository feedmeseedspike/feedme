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
        product:products(name),
        bundle:bundles(name),
        offer:offers(title)
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
export async function getCustomerHistoricalPrizesAction(userId: string) {
  try {
    const supabase = supabaseAdmin;
    
    // Get all order items for this user where price is 0
    // We join with orders to get the date
    const { data: prizes, error } = await supabase
      .from("order_items")
      .select(`
        id,
        price,
        quantity,
        product:products(name),
        order:orders(created_at, status)
      `)
      .eq("price", 0)
      .eq("order.user_id", userId); // This filter might not work directly in Supabase for joined tables like this
    
    // Alternative approach if the above filter fails
    const { data: userOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", userId);
    
    if (!userOrders || userOrders.length === 0) return [];
    
    const orderIds = userOrders.map(o => o.id);
    
    const { data: historicalPrizes, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        id,
        price,
        quantity,
        option,
        order:orders!inner(created_at, status)
      `)
      .eq("price", 0)
      .in("order_id", orderIds)
      .order('created_at', { referencedTable: 'orders', ascending: false });

    if (itemsError) {
        console.error("Error fetching historical prizes:", itemsError);
        return [];
    }

    // Map the product name from the option field, fallback to name, title, or _title
    const mappedPrizes = historicalPrizes?.map((item: any) => {
      let itemName = "Unknown Item";
      if (item.option) {
         itemName = item.option._title || item.option.name || item.option.title || "Unknown Item";
      }
      return {
        ...item,
        product: { name: itemName }
      };
    }) || [];

    return mappedPrizes;
  } catch (error) {
    console.error("Exception fetching historical prizes:", error);
    return [];
  }
}

import { sendUnifiedNotification } from "@/lib/actions/notifications.actions";

export async function adjustCustomerWalletAction(userId: string, amountChange: number, description: string, alertUser: boolean = false) {
  try {
    const supabase = supabaseAdmin;
    
    // Get current balance
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (walletError) {
      throw new Error("Failed to fetch wallet");
    }

    const currentBalance = wallet?.balance || 0;
    const newBalance = currentBalance + amountChange;

    if (newBalance < 0) {
      return { success: false, error: "Cannot deduct more than the current balance." };
    }

    if (!wallet) {
      // Create wallet if not exists
      const { error: createError } = await supabase
        .from("wallets")
        .insert({ user_id: userId, balance: newBalance });
      if (createError) throw new Error("Failed to create wallet");
    } else {
      // Update wallet
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("user_id", userId);
      if (updateError) throw new Error("Failed to update wallet balance");
    }

    // Insert transaction
    const reference = `MANUAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        amount: amountChange,
        payment_status: "successful",
        payment_gateway: "feedme_system",
        transaction_id: reference,
        reference: reference,
        description: description || (amountChange >= 0 ? "Admin Wallet Credit" : "Admin Wallet Deduction"),
        created_at: new Date().toISOString()
      });

    if (txError) {
      console.error("Transaction logging failed, but wallet was updated:", txError);
    }

    if (alertUser) {
      const typeStr = amountChange >= 0 ? "Credited" : "Debited";
      await sendUnifiedNotification({
        userId,
        title: `Wallet Balance ${typeStr}`,
        body: `Your wallet has been ${typeStr.toLowerCase()} by ₦${Math.abs(amountChange)}. Reason: ${description || "Admin Adjustment"}`,
        type: "info",
        link: "/account/wallet"
      });
    }

    return { success: true, balance: newBalance };
  } catch (error: any) {
    console.error("Error adjusting wallet:", error);
    return { success: false, error: error.message };
  }
}
