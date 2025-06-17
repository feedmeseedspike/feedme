// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.42.0";
import nodemailer from "npm:nodemailer@6.9.13";
import { format } from "https://deno.land/x/date_fns@v2.22.1/format/index.js";

interface User {
  id: string;
  email: string;
  display_name: string;
  birthday: string; // ISO 8601 date string (e.g., 'YYYY-MM-DD')
  favorite_fruit: string | null;
}

Deno.serve(async (req) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL, SENDER_EMAIL } = Deno.env.toObject();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !ADMIN_EMAIL || !SENDER_EMAIL) {
    console.error("Missing environment variables.");
    return new Response(JSON.stringify({ message: "Missing environment variables." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // getMonth() is 0-indexed
    const currentDay = today.getDate();

    // Query for users whose birthday matches today's month and day
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, display_name, birthday, favorite_fruit')
      .not('birthday', 'is', null); // Only consider users who have a birthday set

    if (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users.");
    }

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: "No users found or no birthdays today." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const birthdayUsers: User[] = users.filter((user: User) => {
      if (user.birthday) {
        const userBirthday = new Date(user.birthday);
        return userBirthday.getMonth() + 1 === currentMonth && userBirthday.getDate() === currentDay;
      }
      return false;
    });

    if (birthdayUsers.length === 0) {
      return new Response(JSON.stringify({ message: "No birthdays today." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: parseInt(SMTP_PORT) === 465, // Use true for 465, false for other ports (like 587)
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const emailsSent: string[] = [];
    for (const user of birthdayUsers) {
      const mailOptions = {
        from: SENDER_EMAIL,
        to: ADMIN_EMAIL,
        subject: `Happy Birthday to ${user.display_name}!`,
        html: `
          <p>It's ${user.display_name}'s birthday today!</p>
          <p>Email: ${user.email}</p>
          ${user.favorite_fruit ? `<p>Favorite Fruit: ${user.favorite_fruit}</p>` : ''}
          <p>Consider sending them a special message or discount.</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        emailsSent.push(user.email);
        console.log(`Birthday email sent for ${user.display_name}`);
      } catch (emailError: any) {
        console.error(`Failed to send email for ${user.display_name}:`, emailError);
      }
    }

    return new Response(JSON.stringify({ message: `Birthday notifications sent for ${emailsSent.length} customers.`, emailsSent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Edge Function error:", error.message);
    return new Response(JSON.stringify({ message: "Internal server error.", error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/birthday-notifier' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
