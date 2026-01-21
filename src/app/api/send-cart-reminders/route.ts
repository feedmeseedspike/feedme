import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

// ────────────────────────────────────────────────
// Environment & Clients
// ────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!; // fixed typo in your env name

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const resend = new Resend(process.env.RESEND_API_KEY!);

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️  RESEND_API_KEY is missing – emails will NOT be sent");
}

const CRON_SECRET = "default-secret-change-me";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

      // ─── Get user email ───────────────────────────────────────
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(cart.user_id);

      if (userError || !userData?.user?.email) {
        console.warn(`No email found for user ${cart.user_id}`);
        continue;
      }

      const email = userData.user.email;

      // ←─── Log the email being targeted (very useful for debugging)
      console.log(
        `[CART REMINDER] Sending reminder #${nextStage} to: ${email} (cart: ${cart.id})`,
      );

      // ──── More professional email template ─────────────────────
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
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${emailSubjects[nextStage]}</title>
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
                        <h2 style="margin:0 0 16px;font-size:24px;color:#333;">Hey there!</h2>
                        <p style="margin:0 0 24px;font-size:16px;color:#555;line-height:1.6;">
                          You left some amazing items in your cart. We wanted to give you a gentle nudge before they're gone.
                        </p>
                        <p style="margin:0 0 24px;font-size:16px;color:#555;line-height:1.6;">
                          <strong>This is reminder #${nextStage}</strong> – act soon!
                        </p>

                        <!-- CTA Button -->
                        <table cellpadding="0" cellspacing="0" style="margin:32px auto;">
                          <tr>
                            <td style="border-radius:6px;background:#000;">
                              <a href="https://shopfeedme.com/cart" target="_blank" 
                                 style="display:inline-block;padding:16px 36px;font-size:18px;color:#ffffff;text-decoration:none;">
                                View & Complete Your Order
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- Footer note -->
                        <p style="margin:32px 0 0;font-size:14px;color:#777;text-align:center;line-height:1.5;">
                          This is an automated message from FeedMe.<br>
                          If you've already checked out or no longer want these reminders, simply complete your purchase or clear your cart.<br><br>
                          Questions? Reply to this email or visit <a href="https://shopfeedme.com/support" style="color:#000;">our support page</a>.
                        </p>
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

      // Record success
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
