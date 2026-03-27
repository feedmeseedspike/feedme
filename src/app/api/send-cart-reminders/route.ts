import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { sendMail } from "src/utils/email/mailer";
import CartReminderEmail, { CartItemInfo } from "src/utils/email/cartReminderEmail";
import React from "react";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET || "default-secret-change-me";

function extractProvidedSecret(request: Request) {
  const authHeader = request.headers.get("authorization");
  let headerSecret: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer "))
    headerSecret = authHeader.split(" ")[1];

  let querySecret: string | null = null;
  try {
    const url = new URL(request.url);
    querySecret = url.searchParams.get("secret");
  } catch (e) {
    // ignore
  }

  return headerSecret || querySecret;
}

async function runCartReminderJob(supabaseAdmin: any) {
  // Suggestions (Global)
  const { data: suggestionsData } = await supabaseAdmin.from("products").select("name, image_url, price").eq("is_active", true).limit(4);
  const suggestions: CartItemInfo[] = (suggestionsData || []).map((p: any) => ({ name: p.name, image: p.image_url, price: p.price }));

  // Fetch eligible carts
  const { data: carts, error: fetchError } = await supabaseAdmin
    .from("cart")
    .select( `id, user_id, updated_at, cart_reminder_history ( reminder_number, sent_at ) `)
    .gt( "updated_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (fetchError) throw fetchError;
  if (!carts?.length) return { message: "No carts eligible", sent: 0 };

  let sentCount = 0;

  for (const cart of carts) {
    const history = cart.cart_reminder_history || [];
    const lastStage = history.length > 0 ? Math.max(...history.map((h: any) => h.reminder_number)) : 0;
    const lastSentDate = history.find((h: any) => h.reminder_number === lastStage)?.sent_at;

    let nextStage = lastStage + 1;
    let shouldSend = false;

    if (nextStage === 1) shouldSend = new Date(cart.updated_at) <= new Date(Date.now() - 1 * 60 * 60 * 1000);
    else if (nextStage === 2) shouldSend = !!lastSentDate && new Date(lastSentDate) <= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    else if (nextStage === 3) shouldSend = !!lastSentDate && new Date(lastSentDate) <= new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

    if (nextStage > 3 || !shouldSend) continue;

    const { data: cartItemsData } = await supabaseAdmin.from('cart_items').select('*, products(name, image_url, price)').eq('cart_id', cart.id);
    if (!cartItemsData || cartItemsData.length === 0) continue;

    const items: CartItemInfo[] = cartItemsData.map((item: any) => ({
        name: item.products?.name || "Premium Item",
        image: item.products?.image_url,
        price: item.products?.price || item.price || 0,
    }));

    const [userRes, orderRes] = await Promise.all([
        supabaseAdmin.auth.admin.getUserById(cart.user_id),
        supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', cart.user_id)
    ]);

    if (userRes.error || !userRes.data?.user?.email) continue;

    const email = userRes.data.user.email;
    const firstName = userRes.data.user.user_metadata?.first_name || userRes.data.user.user_metadata?.display_name || "Valued Customer";
    const isFirstOrder = (orderRes.count || 0) === 0;

    const subjects: Record<number, string> = { 
        1: "Don't Miss Out! 🏃‍♂️", 
        2: "Is your cart still waiting? 🌿", 
        3: "Final Call: Claim your free prize! 🕛" 
    };

    try {
        const html = await render(React.createElement(CartReminderEmail, { 
            customerName: firstName, stage: nextStage as any, ctaUrl: "https://shopfeedme.com/cart", isFirstOrder, items: items.slice(0, 4), suggestions: suggestions.filter(s => !items.find(i => i.name === s.name)).slice(0, 2)
        }));
        await sendMail({ to: email, subject: subjects[nextStage] || "Cart Reminder", html });
        await supabaseAdmin.from("cart_reminder_history").insert({ cart_id: cart.id, reminder_number: nextStage, sent_at: new Date().toISOString() });
        sentCount++;
    } catch (err) { console.error(err); }
  }

  // --- REVISED CLEANUP: Only expire FREE PRIZE items older than 14 days ---
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: prizeItemsToExpire } = await supabaseAdmin
    .from('cart_items')
    .select('id, option')
    .eq('price', 0)
    .lt('created_at', fourteenDaysAgo);

  if (prizeItemsToExpire && prizeItemsToExpire.length > 0) {
      const idsToDelete = prizeItemsToExpire
        .filter((item: any) => item.option?._is_prize)
        .map((item: any) => item.id);

      if (idsToDelete.length > 0) {
          await supabaseAdmin.from('cart_items').delete().in('id', idsToDelete);
      }
  }

  return { success: true, sent: sentCount };
}

async function handleRequest(request: Request) {
  const providedSecret = extractProvidedSecret(request);
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get('test');
  const stage = parseInt(searchParams.get('stage') || '1');

  if (!testEmail && providedSecret !== CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) return NextResponse.json({ error: "Missing config" }, { status: 500 });
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  if (testEmail) {
    try {
        let items: CartItemInfo[] = [];
        let customerName = "Jeremiah";
        let isFirstOrder = stage === 1;

        const { data: profile } = await supabaseAdmin.from('profiles').select('user_id, display_name').eq('email', testEmail).maybeSingle();
        let userId = profile?.user_id;
        
        if (!userId) {
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
            const targetUser = usersData?.users?.find(u => u.email?.toLowerCase() === testEmail.toLowerCase());
            userId = targetUser?.id;
            customerName = targetUser?.user_metadata?.first_name || targetUser?.user_metadata?.display_name || customerName;
        } else {
            customerName = profile?.display_name || customerName;
        }

        if (userId) {
            const [orderRes, cartRes] = await Promise.all([
                supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
                supabaseAdmin.from('cart').select('id').eq('user_id', userId).maybeSingle()
            ]);
            isFirstOrder = (orderRes.count || 0) === 0;
            if (cartRes.data) {
                const { data: cartItems } = await supabaseAdmin.from('cart_items').select('*, products(name, image_url, price)').eq('cart_id', cartRes.data.id).limit(4);
                if (cartItems) {
                    items = cartItems.map((i: any) => ({
                        name: i.products?.name || "Premium Item",
                        image: i.products?.image_url,
                        price: i.products?.price || i.price || 0
                    }));
                }
            }
        }

        if (items.length === 0) {
            items = [{ 
                name: "Your Free Prize Item", 
                image: "https://res.cloudinary.com/ahisi/image/upload/v1731071676/lettuce_lzm2m8.png", 
                price: 0 
            }];
        }

        const subjects: Record<number, string> = { 1: "Don't Miss Out! 🏃‍♂️", 2: "Is your cart still waiting? 🌿", 3: "Final Call: Claim your free prize! 🕛" };
        const suggestionsData = await supabaseAdmin.from("products").select("name, image_url, price").eq("is_active", true).limit(2);
        const suggestions = (suggestionsData.data || []).map((p: any) => ({ name: p.name, image: p.image_url, price: p.price }));

        const html = await render(React.createElement(CartReminderEmail, { customerName, stage: stage as any, ctaUrl: "https://shopfeedme.com/cart", isFirstOrder, items, suggestions: suggestions.filter(s => !items.find(i => i.name === s.name)).slice(0, 2) }));
        await sendMail({ to: testEmail, subject: subjects[stage] || "Test Reminder", html });
        return NextResponse.json({ success: true, message: `Instacart-Style Test Stage ${stage} sent to ${testEmail}` });
    } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
  }

  try { const result = await runCartReminderJob(supabaseAdmin); return NextResponse.json(result); } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function GET(request: Request) { return handleRequest(request); }
export async function POST(request: Request) { return handleRequest(request); }
