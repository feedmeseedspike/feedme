// app/api/send-bulk-email/route.ts

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(request: Request) {
  console.log("=== BULK EMAIL API CALLED ===");

  try {
    // 1. Parse body
    const body = await request.json();
    console.log("Request body received:", body);

    const { testMode = true } = body;

    // if (!message || typeof message !== "string") {
    //   console.log("Validation failed: message missing or not string");
    //   return new Response(
    //     JSON.stringify({ error: "Message is required and must be a string" }),
    //     { status: 400 }
    //   );
    // }
    // console.log("Message validated:", message.substring(0, 100) + "...");

    // 2. Environment variables check
    console.log("Env vars check:");
    console.log(
      "NEXT_PUBLIC_SUPABASE_URL exists:",
      !!process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    console.log("SERVICE_ROLE_KEY exists:", !!process.env.SERVICE_ROLE_KEY);
    console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
      return new Response(JSON.stringify({ error: "Missing Supabase URL" }), {
        status: 500,
      });
    }

    if (!process.env.SERVICE_ROLE_KEY) {
      console.error("Missing SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Missing Supabase service role key" }),
        { status: 500 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY");
      return new Response(JSON.stringify({ error: "Missing Resend API key" }), {
        status: 500,
      });
    }

    // 3. Initialize clients
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SERVICE_ROLE_KEY!
    );
    console.log("Supabase client created");

    const resend = new Resend(process.env.RESEND_API_KEY!);
    console.log("Resend client created");

    // 4. Fetch users from Supabase
    console.log("Fetching users from 'users' table...");
    const { data: profiles, error: fetchError } = await supabase
      .from("users")
      .select("email");

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch users", details: fetchError }),
        { status: 500 }
      );
    }

    console.log(`Fetched ${profiles?.length || 0} users from database`);

    if (!profiles || profiles.length === 0) {
      console.log("No profiles found");
      return new Response(
        JSON.stringify({ error: "No users found in database" }),
        { status: 404 }
      );
    }

    // 5. Test mode filtering
    let targetProfiles = profiles as { email: string }[];

    if (testMode) {
      console.log(
        "Test mode enabled — filtering for tolulopebamisile@gmail.com"
      );
      console.log(
        "All emails (first 10):",
        profiles.slice(0, 10).map((p: any) => p.email)
      );

      targetProfiles = profiles.filter(
        (p: any) =>
          p.email?.toLowerCase().trim() === "tolulopebamisile@gmail.com"
      );

      console.log(`Found ${targetProfiles.length} matching test email(s)`);

      if (targetProfiles.length === 0) {
        return new Response(
          JSON.stringify({
            error: "Test email not found in database",
            tip: "tolulopebamisile@gmail.com is not in your 'users' table. Add it manually or change the test email in the code.",
            sampleEmails: profiles.slice(0, 5).map((p: any) => p.email),
          }),
          { status: 404 }
        );
      }
    } else {
      console.log("Production mode — sending to ALL users");
    }

    console.log(`Final target count: ${targetProfiles.length} recipient(s)`);

    // 6. Build emails — using Resend sandbox for instant testing
    const emails = targetProfiles.map((profile) => ({
      from: "FeedMe <noreply@shopfeedme.com>",
      to: [profile.email],
      subject: "Important: Temporary Closure Notice – January 2026",
      html: createEmailHtml(),
    }));

    console.log(`Prepared ${emails.length} email object(s)`);
    console.log("Sample recipient:", emails[0]?.to);
    console.log("From address:", emails[0]?.from);

    // 7. Send via Resend in batches
    console.log("Starting batch send via Resend...");
    const errors: any[] = [];
    const batchSize = 100;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      console.log(
        `Sending batch ${i / batchSize + 1} (${batch.length} emails)`
      );

      try {
        const { data, error } = await resend.batch.send(batch);

        if (error) {
          console.error(`Batch failed:`, error);
          errors.push({ batchIndex: i / batchSize + 1, error });
        } else {
          console.log(`Batch ${i / batchSize + 1} sent successfully`);
        }
      } catch (sendError) {
        console.error(
          `Exception while sending batch ${i / batchSize + 1}:`,
          sendError
        );
        errors.push({ batchIndex: i / batchSize + 1, error: sendError });
      }
    }

    // 8. Final result
    if (errors.length > 0) {
      console.error("Some batches failed:", errors);
      return new Response(
        JSON.stringify({
          error: "Some emails failed to send",
          failedBatches: errors.length,
          details: errors,
        }),
        { status: 500 }
      );
    }

    console.log("ALL EMAILS SENT SUCCESSFULLY!");
    return new Response(
      JSON.stringify({
        success: true,
        message: testMode
          ? "Test email sent successfully!"
          : "All emails sent successfully!",
        sentCount: targetProfiles.length,
        note: testMode
          ? "Sent using Resend sandbox (onboarding@resend.dev)"
          : undefined,
      }),
      { status: 200 }
    );
  } catch (unexpectedError) {
    console.error("UNHANDLED ERROR in POST handler:", unexpectedError);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details:
          unexpectedError instanceof Error
            ? unexpectedError.message
            : String(unexpectedError),
      }),
      { status: 500 }
    );
  }
}

// Professional, modern HTML email template
function createEmailHtml() {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Year-End Message & Temporary Closure Notice</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #10b981; padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 32px; font-weight: 600; letter-spacing: 0.5px; }
    .content { padding: 40px; color: #333333; line-height: 1.7; }
    .content p { margin: 0 0 20px 0; font-size: 16px; }
    .highlight { background-color: #d1fae5; padding: 28px; border-left: 6px solid #10b981; margin: 32px 0; font-size: 17px; border-radius: 8px; }
    .highlight strong { color: #065f46; }
    .closing { font-style: italic; color: #444444; margin: 30px 0 20px; }
    .signature { font-weight: 600; color: #10b981; }
    .footer { background-color: #f8f8f8; padding: 30px; text-align: center; font-size: 14px; color: #666666; }
    .footer a { color: #10b981; text-decoration: none; font-weight: 500; }
    @media only screen and (max-width: 600px) {
      .container { margin: 20px; border-radius: 8px; }
      .content { padding: 30px; }
      .header { padding: 35px 20px; }
      .header h1 { font-size: 28px; }
      .highlight { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FeedMe</h1>
    </div>
    <div class="content">
      <p>Dear Valued Customer,</p>

      <p>As 2025 draws to a close, we want to pause and say <strong>thank you</strong>.</p>

      <p>This year marks FeedMe’s first full year of operations, and it has been nothing short of extraordinary. With your trust and support, we have achieved several staggering and unprecedented milestones — feats that once felt ambitious, and are now firmly part of our story. We look forward to sharing these highlights with you before the year ends.</p>

      <p>To build on this momentum and prepare for an even stronger 2026, FeedMe will be taking a short, intentional break. This period will allow our team to rest, reset, and reorganise our systems, ensuring that our operations, infrastructure, and service delivery are optimised to serve you better in the year ahead.</p>

      <div class="highlight">
        <p>Please note that FeedMe will be temporarily closed from <strong>Monday, 5th January</strong> to <strong>Saturday, 10th January 2026</strong>. During this time, we will not be processing orders or responding to inquiries.</p>
        <p>To avoid any disruption, we kindly encourage you to place any orders you may need on or before <strong>Saturday, 3rd January 2026</strong>.</p>
      </div>

      <p>This pause is a deliberate investment in better service, smoother operations, and a more reliable FeedMe experience for you in 2026. We deeply appreciate your understanding and continued partnership as we take this important step.</p>

      <p>We will resume full operations on <strong>Monday, 12th January 2026</strong>, refreshed, reorganised, and ready to serve you even better.</p>

      <p class="closing">Warm regards,</p>
      <p class="signature">The FeedMe Team</p>
    </div>
    <div class="footer">
      <p>FeedMe Limited • <a href="https://www.shopfeedme.com">www.shopfeedme.com</a></p>
      <p><a href="#">Unsubscribe</a> | <a href="#">Contact Us</a></p>
      <p style="font-size:12px; color:#999; margin-top:20px;">© 2025 FeedMe Limited. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
}