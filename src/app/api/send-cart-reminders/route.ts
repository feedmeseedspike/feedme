import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Ensures no build-time execution

const CRON_SECRET = "default-secret-change-me";

export async function POST(request: Request) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Lazy init clients
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase env vars");
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const resend = new Resend(resendApiKey || "");

  if (!resendApiKey) {
    console.warn("RESEND_API_KEY missing – emails won't send");
  }

  try {
    // Fetch eligible carts (last activity < 90 days)
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
      return NextResponse.json({ message: "No carts eligible for reminders" });
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

      // Your timing logic (adjusted slightly for clarity)
      if (nextStage === 1) {
        shouldSend =
          new Date(cart.updated_at) <=
          new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour
      } else if (nextStage === 2) {
        shouldSend =
          !!lastSentDate &&
          new Date(lastSentDate) <=
            new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days after last send
      } else if (nextStage === 3) {
        shouldSend =
          !!lastSentDate &&
          new Date(lastSentDate) <=
            new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day after last send (or adjust)
      }

      if (nextStage > 3 || !shouldSend) continue;

      // Get user email
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(cart.user_id);

      if (userError || !userData?.user?.email) {
        console.warn(`No email for user ${cart.user_id}`);
        continue;
      }

      const email = userData.user.email;
      const firstName = userData.user.user_metadata?.first_name || "Customer";

      console.log(`[REMINDER #${nextStage}] → ${email} (cart ${cart.id})`);

      // ────────────────────── Stage-specific content ──────────────────────
      const templates = {
        1: {
          subject: "Oops! Your kitchen essentials are waiting 🥑🍋",
          preview:
            "Your cart is saved – complete your purchase in the next 24 hours for free Apple!",
          ctaText: "COMPLETE MY ORDER",
          ctaUrl: "https://shopfeedme.com/cart", // ← add ?cart_id=... if needed
          body: `
            <p>Hi ${firstName},</p>
            <p>We noticed you left some delicious items in your cart! We've saved them for you.</p>
            <p><strong>Special Early-Bird Bonus:</strong> Complete your purchase within 24 hours and we'll include a <strong>free apple</strong> to keep the doctor away!</p>
            <p>[Dynamic cart items with images – add here if you fetch cart contents]</p>
            <p><a href="https://shopfeedme.com/cart" style="display:inline-block; padding:12px 24px; background:#000; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
              COMPLETE MY ORDER
            </a></p>
            <p>Need help? Questions about products or shipping? Please call or Whatsapp chat <strong>0808 828 2487</strong> – we're here to help!</p>
            <p>The FeedMe Team.</p>
            <p><em>PS: All our ingredients are sourced fresh daily and shipped with care to preserve their natural goodness!</em></p>
          `,
        },
        2: {
          subject:
            "Still thinking about it? Your fresh picks won't wait forever 🌿",
          preview: "Limited stock but we've got a special offer just for you",
          ctaText: "CLAIM MY 10% OFF",
          ctaUrl: "https://shopfeedme.com/cart?promo=FRESH10",
          body: `
            <p>Hi ${firstName},</p>
            <p>Did you know? We carefully source and rotate our inventory to ensure maximum freshness, which means some items in your cart could sell out soon.</p>
            <p>To help you decide, here's a special offer:</p>
            <p><strong>Use code FRESH10 at checkout for 5% off your entire order!</strong></p>
            <p>[Dynamic cart items with images]</p>
            <p><a href="https://shopfeedme.com/cart?promo=FRESH10" style="display:inline-block; padding:12px 24px; background:#000; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
             CLAIM MY 10% OFF
            </a></p>
            <p>Why customers love FeedMe:</p>
            <ul>
              <li>✓ 100% organic, sustainably sourced ingredients</li>
              <li>✓ 3hrs shipping on fresh items</li>
              <li>✓ Clean packaging</li>
            </ul>
            <p>Freshly yours,<br>The FeedMe Team.</p>
            <p><em>P.S. This offer expires in 24 hours. Stock is updated daily – secure your items before they're gone!</em></p>
          `,
        },
        3: {
          subject: "Your cart expires today! 🕛",
          preview: "We've saved one last offer for you",
          ctaText: "COMPLETE PURCHASE NOW - Free Delivery",
          ctaUrl: "https://shopfeedme.com/cart",
          body: `
            <p>Hi ${firstName},</p>
            <p>This is our final reminder about the items waiting in your cart. We'll need to clear saved carts tomorrow to make room for new inventory.</p>
            <p><strong>Get free shipping on orders over ₦100,000.</strong></p>
            <p>We'd hate for you to miss out on these kitchen essentials. This offer expires at midnight tonight.</p>
            <p>[Dynamic cart items with images]</p>
            <p><a href="https://shopfeedme.com/cart" style="display:inline-block; padding:12px 24px; background:#000; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
          COMPLETE PURCHASE NOW - Free Delivery
            </a></p>
            <p>Yours Freshly,<br>The FeedMe Team.</p>
          `,
        },
      };

      const template = templates[nextStage as keyof typeof templates];

      if (!template) continue;

      const { error: emailError } = await resend.emails.send({
        from: "FeedMe Orders <orders@shopfeedme.com>",
        to: email,
        subject: template.subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${template.subject}</title>
          </head>
          <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background:#000;padding:24px;text-align:center;">
                        <h1 style="margin:0;color:#ffffff;font-size:28px;">FeedMe</h1>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding:32px 40px;">
                        ${template.body}
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background:#f8f8f8;padding:20px;text-align:center;font-size:13px;color:#666;">
                        © ${new Date().getFullYear()} FeedMe Africa. All rights reserved.<br>
                        Lagos, Nigeria
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      if (emailError) {
        console.error("Email send failed:", emailError);
        continue;
      }

      // Record the send
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
          `[SUCCESS] Reminder #${nextStage} sent & recorded for cart ${cart.id}`,
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
