import { NextResponse } from 'next/server';
import { supabaseAdmin } from 'src/lib/supabaseAdmin';
import { sendMail } from 'src/utils/email/mailer';
import { render } from "@react-email/render";
import BirthdayEmail from "src/utils/email/birthdayEmail";
import React from 'react';

export const dynamic = 'force-dynamic'; // Ensure this route is never cached

// This route should be protected or triggered by a secure cron job
export async function GET(request: Request) {
  try {
    const today = new Date();
    
    // Fetch all profiles that have a birthday set (excluding email from select as it's not in profiles)
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name, birthday, favorite_fruit');

    if (error) {
        console.error("Profile fetch error:", error);
        throw error;
    }

    if (!profiles) return NextResponse.json({ success: true, count: 0 });

    const todaysBirthdays = profiles.filter((profile: any) => {
      if (!profile.birthday) return false;
      const dob = new Date(profile.birthday);
      return (
        dob.getDate() === today.getDate() &&
        dob.getMonth() === today.getMonth() // JS getMonth is 0-indexed, same as today.getMonth()
      );
    });

    if (todaysBirthdays.length === 0) {
      return NextResponse.json({ success: true, message: "No birthdays today", count: 0 });
    }

    const emailPromises = todaysBirthdays.map(async (user: any) => {
        // Fetch email from Auth Admin API since it's not in profiles table
        let email = null;
        try {
            const { data: authData } = await supabaseAdmin.auth.admin.getUserById(user.user_id);
            email = authData?.user?.email;
        } catch (e) {
            console.error("Auth fetch error", e);
        }

        if (!email) {
           return;
        }

        const userName = user.display_name || "Valued Customer";
        
        let htmlContent = "";
        try {
            htmlContent = await render(
            React.createElement(BirthdayEmail, { 
                customerName: userName, 
                favoriteFruit: user.favorite_fruit 
            })
            );
        } catch (renderError) {
            console.error("Render error:", renderError);
            return;
        }
       
        return sendMail({
          to: email,
          subject: "Happy Birthday from FeedMe! 🎂",
          html: htmlContent
        }).then(res => {
            console.log(`Birthday email sent to ${email}`);
            return res;
        }).catch(err => {
            console.error(`Failed to send birthday email to ${email}:`, err);
            return null;
        });
    });

    await Promise.all(emailPromises);

    return NextResponse.json({ 
        success: true, 
        message: `Sent ${todaysBirthdays.length} birthday emails`, 
        count: todaysBirthdays.length 
    });

  } catch (err: any) {
    console.error("Birthday cron error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
