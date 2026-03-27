import { NextResponse } from 'next/server';
import { supabaseAdmin } from 'src/lib/supabaseAdmin';
import { sendMail } from 'src/utils/email/mailer';
import { render } from "@react-email/render";
import PrizeReminderEmail from "src/utils/email/prizeReminderEmail";
import React from 'react';

export const dynamic = 'force-dynamic';

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

/**
 * Prize Expiry & Reminder Cron Job
 */
export async function GET(request: Request) {
  const providedSecret = extractProvidedSecret(request);
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get('test');
  const type = searchParams.get('type') || 'voucher';

  if (!testEmail && providedSecret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (testEmail) {
    try {
      const isVoucher = type === 'voucher';
      const html = await render(
        React.createElement(PrizeReminderEmail, {
          customerName: "Jeremiah",
          prizeName: isVoucher ? "Spin & Win: 10% OFF" : "Free Organic Chicken",
          expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          actionUrl: isVoucher 
            ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://orders.feedmeafrica.com'}/checkout`
            : `${process.env.NEXT_PUBLIC_APP_URL || 'https://orders.feedmeafrica.com'}/cart`,
          isVoucher: isVoucher,
          voucherCode: isVoucher ? "TEST-PRIZE-123" : undefined,
        })
      );

      await sendMail({
        to: testEmail,
        subject: `TEST ${type.toUpperCase()}: Your prize is expiring soon! 🎁`,
        html,
      });

      return NextResponse.json({ success: true, message: `Test ${type} email sent to ${testEmail}` });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  try {
    const now = new Date();
    const threeDaysFromNowStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysFromNowEnd = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const elevenDaysAgoStart = new Date(now.getTime() - 11.5 * 24 * 60 * 60 * 1000);
    const elevenDaysAgoEnd = new Date(now.getTime() - 10.5 * 24 * 60 * 60 * 1000);

    const stats = { vouchersReminded: 0, cartItemsReminded: 0, cartItemsExpired: 0 };

    // --- 1. VOUCHERS REMINDER ---
    const { data: expiringVouchers } = await supabaseAdmin
      .from('vouchers')
      .select('*, profiles:user_id(display_name, email)')
      .eq('is_active', true)
      .gte('valid_to', threeDaysFromNowStart.toISOString())
      .lte('valid_to', threeDaysFromNowEnd.toISOString());

    if (expiringVouchers && expiringVouchers.length > 0) {
      for (const voucher of expiringVouchers) {
        if (voucher.max_uses !== null && voucher.used_count >= voucher.max_uses) continue;
        if (!(voucher.name?.includes("Spin & Win") || voucher.name?.includes("Reward"))) continue;

        let email = (voucher.profiles as any)?.email;
        let customerName = (voucher.profiles as any)?.display_name || "Valued Customer";

        if (!email && voucher.user_id) {
          const { data: authData } = await supabaseAdmin.auth.admin.getUserById(voucher.user_id);
          email = authData?.user?.email;
          customerName = authData?.user?.user_metadata?.display_name || authData?.user?.user_metadata?.full_name || customerName;
        }

        if (email) {
          const expiryDateFormatted = new Date(voucher.valid_to).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const html = await render(React.createElement(PrizeReminderEmail, { customerName, prizeName: voucher.name, expiryDate: expiryDateFormatted, actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://orders.feedmeafrica.com'}/checkout?apply_voucher=${voucher.code}`, isVoucher: true, voucherCode: voucher.code }));
          await sendMail({ to: email, subject: `Reminder: Your ${voucher.name} expires soon! 🎁`, html });
          stats.vouchersReminded++;
        }
      }
    }

    // --- 2. CART ITEMS REMINDER ---
    const { data: expiringCartItems } = await supabaseAdmin
      .from('cart_items')
      .select('*, cart:cart_id(user_id), products(name)')
      .eq('price', 0)
      .gte('created_at', elevenDaysAgoStart.toISOString())
      .lte('created_at', elevenDaysAgoEnd.toISOString());

    if (expiringCartItems && expiringCartItems.length > 0) {
      for (const item of expiringCartItems) {
        if (!item.option?._is_prize) continue;
        const userId = (item.cart as any)?.user_id;
        if (!userId) continue;

        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
        const email = authData?.user?.email;
        const customerName = authData?.user?.user_metadata?.display_name || authData?.user?.user_metadata?.full_name || "Valued Customer";

        if (email) {
          const fourteenDaysAfterCreation = new Date(new Date(item.created_at).getTime() + 14 * 24 * 60 * 60 * 1000);
          const expiryDateFormatted = fourteenDaysAfterCreation.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const html = await render(React.createElement(PrizeReminderEmail, { customerName, prizeName: item.products?.name || item.option.label || "Free Prize", expiryDate: expiryDateFormatted, actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://orders.feedmeafrica.com'}/cart`, isVoucher: false }));
          await sendMail({ to: email, subject: `Don't forget your free prize! 🎁`, html });
          stats.cartItemsReminded++;
        }
      }
    }

    // --- 3. EXPIRE CART ITEMS ---
    const { data: itemsToExpire } = await supabaseAdmin.from('cart_items').select('id, option').eq('price', 0).lt('created_at', fourteenDaysAgo.toISOString());
    if (itemsToExpire && itemsToExpire.length > 0) {
      const idsToDelete = itemsToExpire.filter(item => (item.option as any)?._is_prize).map(item => item.id);
      if (idsToDelete.length > 0) await supabaseAdmin.from('cart_items').delete().in('id', idsToDelete);
    }
    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
