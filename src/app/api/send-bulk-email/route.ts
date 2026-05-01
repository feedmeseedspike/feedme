// app/api/send-bulk-email/route.ts

import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/utils/email/mailer";
import fs from "fs";
import path from "path";

const LOG_FILE_PATH = path.join(process.cwd(), "bulk-email-log.json");
const SKIP_FILE_PATH = path.join(process.cwd(), "bulk-email-skipped.json");

export async function GET() {
  console.log("=== FETCHING BULK EMAIL STATUS ===");
  try {
    const serviceRoleKey = process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey!);

    // Fetch users (paginated)
    let allUsers: any[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      const users = data?.users || [];
      allUsers = [...allUsers, ...users];
      hasMore = users.length === 1000;
      page++;
    }

    // Load logs
    let sentEmails: string[] = [];
    if (fs.existsSync(LOG_FILE_PATH)) {
      sentEmails = JSON.parse(fs.readFileSync(LOG_FILE_PATH, "utf8"));
    }
    
    let skippedEmails: string[] = [];
    if (fs.existsSync(SKIP_FILE_PATH)) {
      skippedEmails = JSON.parse(fs.readFileSync(SKIP_FILE_PATH, "utf8"));
    }

    return new Response(JSON.stringify({ 
      users: allUsers.map(u => {
        const email = u.email?.toLowerCase().trim();
        return {
          email: u.email,
          name: u.user_metadata?.display_name || "Customer",
          sent: sentEmails.includes(email),
          skipped: skippedEmails.includes(email)
        };
      }),
      totalSent: sentEmails.length,
      totalSkipped: skippedEmails.length
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log("=== BULK EMAIL API CALLED ===");

  try {
    // 1. Parse body
    const body = await request.json();
    const { testMode = true, specificEmails = null, skipEmails = null } = body;

    console.log(`Mode: ${testMode ? "TEST" : "PRODUCTION"}`);
    if (specificEmails) console.log(`Targeting ${specificEmails.length} specific emails.`);
    if (skipEmails) console.log(`Skipping ${skipEmails.length} specific emails.`);

    // Load logs
    let sentEmails: string[] = [];
    if (!testMode && fs.existsSync(LOG_FILE_PATH)) {
      try {
        sentEmails = JSON.parse(fs.readFileSync(LOG_FILE_PATH, "utf8"));
      } catch (e) {}
    }
    
    let skippedEmails: string[] = [];
    if (!testMode && fs.existsSync(SKIP_FILE_PATH)) {
      try {
        skippedEmails = JSON.parse(fs.readFileSync(SKIP_FILE_PATH, "utf8"));
      } catch (e) {}
    }

    // Handle skipEmails first
    if (skipEmails && Array.isArray(skipEmails) && !testMode) {
      console.log("Adding skipped emails to log...");
      const updatedSkipped = Array.from(new Set([...skippedEmails, ...skipEmails.map(e => e.toLowerCase().trim())]));
      fs.writeFileSync(SKIP_FILE_PATH, JSON.stringify(updatedSkipped, null, 2));
      return new Response(JSON.stringify({ success: true, message: "Emails marked as skipped" }), { status: 200 });
    }

    // if (!message || typeof message !== "string") {
    //   console.log("Validation failed: message missing or not string");
    //   return new Response(
    //     JSON.stringify({ error: "Message is required and must be a string" }),
    //     { status: 400 }
    //   );
    // }
    // console.log("Message validated:", message.substring(0, 100) + "...");

    // 2. Environment variables check
    const serviceRoleKey = process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    console.log("Env vars check:");
    console.log(
      "NEXT_PUBLIC_SUPABASE_URL exists:",
      !!process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    console.log("SERVICE_ROLE_KEY (or fallback) exists:", !!serviceRoleKey);
    console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
      return new Response(JSON.stringify({ error: "Missing Supabase URL" }), {
        status: 500,
      });
    }

    if (!serviceRoleKey) {
      console.error("Missing SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Missing Supabase service role key" }),
        { status: 500 }
      );
    }

    // if (!process.env.RESEND_API_KEY) {
    //   console.error("Missing RESEND_API_KEY");
    //   return new Response(JSON.stringify({ error: "Missing Resend API key" }), {
    //     status: 500,
    //   });
    // }

    // 3. Initialize clients
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey!
    );
    console.log("Supabase client created");

    // const resend = new Resend(process.env.RESEND_API_KEY!);
    // console.log("Resend client created");

    // 4. Fetch users from Supabase (Database + Auth)
    console.log("Fetching all users (including pagination for 301+ users)...");
    
    // Fetch from 'users' table
    const { data: dbUsers, error: dbFetchError } = await supabase
      .from("users")
      .select("email, display_name");

    if (dbFetchError) {
      console.warn("Database fetch error (continuing with auth only):", dbFetchError);
    }

    // Fetch from Auth (Admin API) with pagination
    let authUsers: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: 1000 // Supabase limit is usually 1000 per page for admin
      });

      if (authError) {
        console.error(`Auth fetch error on page ${page}:`, authError);
        hasMore = false;
        if (authUsers.length === 0 && (dbFetchError || !dbUsers)) {
          return new Response(JSON.stringify({ error: "Failed to fetch users" }), { status: 500 });
        }
      } else {
        const users = authData?.users || [];
        authUsers = [...authUsers, ...users];
        hasMore = users.length === 1000;
        page++;
      }
    }

    console.log(`Fetched ${dbUsers?.length || 0} users from DB and ${authUsers.length} from Auth`);

    // 5. Deduplicate and merge users
    const emailMap = new Map<string, { email: string; name: string }>();

    // Add Auth users first
    authUsers.forEach((u) => {
      if (u.email) {
        emailMap.set(u.email.toLowerCase().trim(), {
          email: u.email.toLowerCase().trim(),
          name: (u.user_metadata as any)?.display_name || "Valued Customer",
        });
      }
    });

    // Add/Update with DB users (might have better names)
    (dbUsers || []).forEach((u: any) => {
      if (u.email) {
        const email = u.email.toLowerCase().trim();
        const existing = emailMap.get(email);
        emailMap.set(email, {
          email,
          name: u.display_name || existing?.name || "Valued Customer",
        });
      }
    });

    const allProfiles = Array.from(emailMap.values());
    console.log(`Unique recipient count: ${allProfiles.length}`);

    // 6. Test mode filtering + Resume logic + Specific targeting
    let targetProfiles = allProfiles;

    if (specificEmails && Array.isArray(specificEmails)) {
      console.log("Using specific email list from request...");
      targetProfiles = allProfiles.filter(p => specificEmails.includes(p.email));
    } else if (testMode) {
      console.log("Test mode enabled — filtering for oyedelejeremiah.ng@gmail.com");
      targetProfiles = allProfiles.filter(
        (p) => p.email === "oyedelejeremiah.ng@gmail.com"
      );

      // If test email not found in lists, add it manually for testing
      if (targetProfiles.length === 0) {
        console.log("Test email not found in lists, adding manually for test.");
        targetProfiles = [{ email: "oyedelejeremiah.ng@gmail.com", name: "Jeremiah (Test)" }];
      }

      console.log(`Found ${targetProfiles.length} matching test email(s)`);
    } else {
      console.log("Production mode — filtering out already sent/skipped emails");
      const beforeFilter = targetProfiles.length;
      targetProfiles = allProfiles.filter(p => !sentEmails.includes(p.email) && !skippedEmails.includes(p.email));
      console.log(`Resuming: ${targetProfiles.length} remaining out of ${beforeFilter} total users.`);
    }

    console.log(`Final target count: ${targetProfiles.length} recipient(s)`);

    // 7. Build emails
    const emails = targetProfiles.map((profile) => ({
      from: "FeedMe <orders.feedmeafrica@gmail.com>",
      to: profile.email,
      subject: "🚨 FINAL CALL: Your Free Delivery Expires Tomorrow!",
      html: createEmailHtml(profile.name),
    }));

    console.log(`Prepared ${emails.length} email object(s)`);
    console.log("Sample recipient:", emails[0]?.to);

    // 8. Send via Mailer in batches
    console.log("Starting batch send via Nodemailer...");
    const errors: any[] = [];
    const batchSize = 10; // Smaller batch for better stability
    let successfullySentThisRun = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      console.log(
        `Sending batch ${i / batchSize + 1} (${batch.length} emails)`
      );

      // Sending sequentially within batch to avoid overwhelming SMTP
      for (const email of batch) {
        try {
          await sendMail({
            to: email.to,
            subject: email.subject,
            html: email.html,
            from: email.from
          });
          
          successfullySentThisRun++;

          // Update log file if in production
          if (!testMode) {
            sentEmails.push(email.to);
            try {
              fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(sentEmails, null, 2));
            } catch (writeErr: any) {
              console.error("Failed to update log file:", writeErr.message);
            }
          }
        } catch (sendError: any) {
          console.error(`Failed to send to ${email.to}:`, sendError.message);
          errors.push({ email: email.to, error: sendError.message || String(sendError) });
        }
      }
      console.log(`Batch complete. Progress this run: ${successfullySentThisRun}/${emails.length}`);
    }

    // 9. Final result
    console.log(`COMPLETED: ${successfullySentThisRun} sent this run. Total campaign reach: ${sentEmails.length}`);
    
    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        message:
          errors.length > 0
            ? "Some emails failed to send"
            : "Process complete",
        sentThisRun: successfullySentThisRun,
        totalSentInCampaign: sentEmails.length,
        errors: errors.length > 0 ? errors : undefined,
        note: testMode
          ? "Sent using internal Gmail SMTP (Nodemailer)"
          : `Resume Log updated: ${sentEmails.length} total users reached so far.`,
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

// Finalized professional HTML email template for Free Delivery Reminder
function createEmailHtml(name: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Delivery Reminder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .image-container { width: 100%; line-height: 0; }
    .hero-image { width: 100%; height: auto; display: block; }
    .content { padding: 40px 20px; color: #111111; line-height: 1.6; }
    .content h2 { margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #000000; }
    .content p { margin: 0 0 16px 0; font-size: 16px; color: #333333; }
    .notice-section { border-top: 1px solid #eeeeee; border-bottom: 1px solid #eeeeee; padding: 24px 0; margin: 32px 0; text-align: center; }
    .notice-section p { margin: 0; font-size: 18px; font-weight: 700; color: #1B6013; text-transform: uppercase; letter-spacing: 0.05em; }
    .btn { display: inline-block; background-color: #1B6013; color: #ffffff !important; padding: 18px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; margin-top: 20px; box-shadow: 0 4px 10px rgba(27, 96, 19, 0.15); }
    .footer { padding: 40px 20px; text-align: center; font-size: 12px; color: #999999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="image-container">
      <img src="https://fyldgskqxrfmrhyluxmw.supabase.co/storage/v1/object/public/promotions/promotions/free-deliery.jpeg" alt="Free Delivery" class="hero-image">
    </div>
    <div class="content">
      <h2>Hi ${name}, 👋</h2>
      
      <p>You’ve got priority access to <strong>FREE delivery</strong> this week! 🎉</p>
      
      <p>Order above <strong>₦25,000</strong> and we’ll deliver ASAP at no extra cost to you.</p>

      <div class="notice-section">
        <p>⚡️ Hurry! offer ends tomorrow, May 2nd.</p>
        <a href="https://www.shopfeedme.com/" class="btn">Order Now & Save</a>
      </div>

      <p>Don't miss out on this opportunity to get your essentials delivered for free.</p>

      <p style="margin-top: 32px; font-weight: 600;">Stay fresh,<br>The FeedMe Team</p>
    </div>
    <div class="footer">
      <p>© 2026 FeedMe Africa • <a href="https://www.shopfeedme.com" style="color: #999999; text-decoration: none;">www.shopfeedme.com</a></p>
    </div>
  </div>
</body>
</html>
`;
}