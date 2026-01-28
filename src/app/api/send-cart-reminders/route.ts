import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

// Force this route to be fully dynamic (no static generation / build-time execution)
export const dynamic = "force-dynamic";

// Optional: if you still see issues, add these (rarely needed)
// export const revalidate = 0;
// export const fetchCache = 'force-no-store';

const CRON_SECRET = "default-secret-change-me"; // keep or move to env

export async function POST(request: Request) {
  // ── Auth check first (cheap & fast)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Lazy init clients (only when route is actually called)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase env vars at runtime");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const resend = new Resend(resendApiKey || ""); // safe fallback

  if (!resendApiKey) {
    console.warn("⚠️ RESEND_API_KEY missing – emails will NOT be sent");
  }

  try {
    const { data: carts, error: fetchError } = await supabaseAdmin
      .from("cart")
      .select(
        `
        id,
        user_id,
        updated_at,
        cart_reminder_history (
          reminder_number,
          sent_at
        )
      `,
      )
      .gt(
        "updated_at",
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("updated_at", { ascending: false });

    if (fetchError) throw fetchError;
    if (!carts?.length) {
      return NextResponse.json({ message: "No candidate carts found" });
    }

    let sentCount = 0;

    for (const cart of carts) {
      const history = cart.cart_reminder_history || [];
      const lastStage =
        history.length > 0
          ? Math.max(...history.map((h: any) => h.reminder_number))
          : 0;

      const lastSentDate = history.find(
        (h: any) => h.reminder_number === lastStage,
      )?.sent_at;

      let nextStage = lastStage + 1;
      let shouldSend = false;

      if (nextStage === 1) {
        shouldSend =
          new Date(cart.updated_at) <= new Date(Date.now() - 3 * 86400000);
      } else if (nextStage === 2) {
        shouldSend =
          !!lastSentDate &&
          new Date(lastSentDate) <= new Date(Date.now() - 7 * 86400000);
      } else if (nextStage === 3) {
        shouldSend =
          !!lastSentDate &&
          new Date(lastSentDate) <= new Date(Date.now() - 12 * 86400000);
      }

      if (nextStage > 3 || !shouldSend) continue;

      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(cart.user_id);

      if (userError || !userData?.user?.email) {
        console.warn(`No email found for user ${cart.user_id}`);
        continue;
      }

      const email = userData.user.email;

      console.log(
        `[CART REMINDER] Sending reminder #${nextStage} to: ${email} (cart: ${cart.id})`,
      );

      // Your email template remains unchanged
      const emailSubjects = [
        "",
        "Your FeedMe Cart is Waiting 🛍️",
        "We Saved These Items Just for You 👀",
        "Final Reminder – Don't Miss Out on Your Cart!",
      ];

      const { error: emailError } = await resend.emails.send({
        from: "FeedMe Orders <orders@shopfeedme.com>",
        to: email,
        subject: emailSubjects[nextStage] || "Cart Reminder",
        html: `...your full HTML template here...`, // keep as-is
      });

      if (emailError) {
        console.error("Email send failed:", emailError);
        continue;
      }

      const { error: insertError } = await supabaseAdmin
        .from("cart_reminder_history")
        .insert({
          cart_id: cart.id,
          reminder_number: nextStage,
          sent_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Failed to save reminder history:", insertError);
      } else {
        sentCount++;
        console.log(
          `[SUCCESS] Reminder #${nextStage} recorded for cart ${cart.id}`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total_candidates: carts.length,
    });
  } catch (err: any) {
    console.error("Cart reminder job failed:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
