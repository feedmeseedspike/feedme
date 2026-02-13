import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    console.log("Starting ULTIMATE MASTER EXPORT (Full Data Join)...");

    // 1. FETCH ALL AUTH USERS (Emails source of truth)
    let authUsersMap: Record<string, any> = {};
    let authPage = 1;
    while (authPage <= 100) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: authPage, perPage: 1000 });
      if (error || !data || !data.users || data.users.length === 0) break;
      data.users.forEach(u => {
        const email = u.email || u.user_metadata?.email || (u.identities && u.identities[0]?.identity_data?.email) || "";
        authUsersMap[u.id.toLowerCase()] = { 
            id: u.id, 
            email, 
            created_at: u.created_at, 
            last_sign_in: u.last_sign_in_at, 
            metadata: u.user_metadata || {},
            email_confirmed_at: u.email_confirmed_at
        };
      });
      if (data.users.length < 1000) break;
      authPage++;
    }

    // 2. FETCH ALL PROFILES (Loyalty, Status, etc.)
    let profilesMap: Record<string, any> = {};
    let profilePage = 0;
    while (profilePage < 50) {
      const { data: pBatch } = await supabaseAdmin.from('profiles').select('*').range(profilePage * 1000, (profilePage + 1) * 1000 - 1);
      if (!pBatch || pBatch.length === 0) break;
      pBatch.forEach(p => { 
          const uid = (p.user_id || "").toLowerCase(); 
          if (uid) profilesMap[uid] = p; 
          else if (p.id) profilesMap[p.id.toLowerCase()] = p; // Fallback if user_id is missing but id is the UUID
      });
      if (pBatch.length < 1000) break;
      profilePage++;
    }

    // 3. FETCH ALL WALLETS
    let walletMap: Record<string, number> = {};
    let walletPage = 0;
    while (walletPage < 50) {
        const { data: wBatch } = await supabaseAdmin.from('wallets').select('user_id, balance').range(walletPage * 1000, (walletPage + 1) * 1000 - 1);
        if (!wBatch || wBatch.length === 0) break;
        wBatch.forEach(w => { if (w.user_id) walletMap[w.user_id.toLowerCase()] = w.balance || 0; });
        if (wBatch.length < 1000) break;
        walletPage++;
    }

    // 4. FETCH ALL ORDERS (Summary)
    const { data: orderStats } = await supabaseAdmin.from('orders').select('user_id, total_amount, created_at');
    const orderMap: Record<string, { count: number; spent: number; last: string | null }> = {};
    (orderStats || []).forEach(o => {
      const uid = (o.user_id || "").toLowerCase();
      if (!uid) return;
      if (!orderMap[uid]) orderMap[uid] = { count: 0, spent: 0, last: null };
      orderMap[uid].count += 1;
      orderMap[uid].spent += (o.total_amount || 0);
      if (!orderMap[uid].last || (o.created_at && new Date(o.created_at) > new Date(orderMap[uid].last!))) orderMap[uid].last = o.created_at;
    });

    // 5. FETCH ALL ADDRESSES
    const { data: addresses } = await supabaseAdmin.from('addresses').select('user_id, phone, city');
    const addressMap: Record<string, { phone: string; city: string }> = {};
    (addresses || []).forEach(a => {
      const uid = (a.user_id || "").toLowerCase();
      if (uid && !addressMap[uid]) addressMap[uid] = { phone: a.phone || "", city: a.city || "" };
    });

    // 6. FETCH CARTS & CART ITEMS
    let cartMap: Record<string, string> = {};
    let cartPage = 0;
    while (cartPage < 50) {
        const { data: cBatch } = await supabaseAdmin.from('cart').select('id, user_id').range(cartPage * 1000, (cartPage + 1) * 1000 - 1);
        if (!cBatch || cBatch.length === 0) break;
        cBatch.forEach(c => { if (c.user_id) cartMap[c.user_id.toLowerCase()] = c.id; });
        if (cBatch.length < 1000) break;
        cartPage++;
    }

    const cartIds = Object.values(cartMap);
    let cartItemsByCartId: Record<string, any[]> = {};
    if (cartIds.length > 0) {
        for (let i = 0; i < cartIds.length; i += 500) {
            const chunk = cartIds.slice(i, i + 500);
            const { data: items } = await supabaseAdmin.from("cart_items").select("cart_id, quantity, price, product:products(name)").in("cart_id", chunk);
            (items || []).forEach(item => {
                if (!cartItemsByCartId[item.cart_id]) cartItemsByCartId[item.cart_id] = [];
                cartItemsByCartId[item.cart_id].push(item);
            });
        }
    }

    // 7. ASSEMBLE CSV
    const headers = [
      "Auth ID", "Name", "Email", "Phone", "City", 
      "Total Orders", "Total Spent", "Last Purchase", 
      "Wallet Balance", "Loyalty Points", "Status",
      "Cart Items", "Won Prizes", "Role", "Joined At", "Last Login"
    ];

    const clean = (val: any) => {
      const s = String(val || '').trim();
      return `"${s.replace(/"/g, '""')}"`;
    };

    const csvRows = Object.values(authUsersMap).map(u => {
      const uid = u.id.toLowerCase();
      const profile = profilesMap[uid] || {};
      const stats = orderMap[uid] || { count: 0, spent: 0, last: null };
      const addr = addressMap[uid] || { phone: "", city: "" };
      const walletBalance = walletMap[uid] || 0;
      
      const cartId = cartMap[uid];
      const items = cartId ? (cartItemsByCartId[cartId] || []) : [];
      const cartSummary = items.filter(i => i.price > 0).map(i => `${i.product?.name || 'Item'} (x${i.quantity})`).join(" | ");
      const prizesSummary = items.filter(i => i.price === 0).map(i => i.product?.name || 'Prize').join(" | ");

      // IMPROVED NAME RESOLUTION:
      // Try profile, then various metadata keys, then email prefix as a last resort
      const displayName = profile.display_name || 
                          u.metadata?.display_name || 
                          u.metadata?.full_name || 
                          u.metadata?.name || 
                          u.metadata?.username ||
                          u.email?.split('@')[0] || 
                          "Member";

      const lastOrderDate = stats.last ? new Date(stats.last).toLocaleDateString() : "Never";
      const joinedDate = u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A";

      return [
        clean(u.id),
        clean(displayName),
        clean(u.email),
        clean(addr.phone),
        clean(addr.city),
        stats.count,
        stats.spent,
        clean(lastOrderDate),
        walletBalance,
        profile.loyalty_points || 0,
        clean(profile.status || 'active'),
        clean(cartSummary),
        clean(prizesSummary),
        profile.is_staff ? "Staff" : (profile.role || "Buyer"),
        clean(joinedDate),
        clean(u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString() : "N/A")
      ].join(",");
    });

    return new NextResponse([headers.join(","), ...csvRows].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="FULL_MASTER_EXPORT_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });

  } catch (error: any) {
    console.error("Ultimate Export Failure:", error);
    return new NextResponse(`Export Error: ${error.message}`, { status: 500 });
  }
}
