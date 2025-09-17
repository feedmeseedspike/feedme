import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { sendMail } from "@/utils/email/mailer";
import ExitIntentEmail from "@/utils/email/exitIntentEmail";
import { createClient } from "@/utils/supabase/server";
import { generateWelcomeDiscountCode, createWelcomeDiscount } from "@/utils/discountUtils";
import React from "react";

interface ExitIntentRequest {
  name: string;
  email: string;
}

export async function POST(request: Request) {
  try {
    const body: ExitIntentRequest = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if email already exists (to avoid duplicate discount codes)
    const { data: existingVoucher } = await supabase
      .from("vouchers")
      .select("code")
      .eq("description", `Exit intent discount for ${email}`)
      .eq("is_active", true)
      .single();

    let discountCode: string;
    let discountPercentage = 5;

    if (existingVoucher) {
      // Use existing discount code
      discountCode = existingVoucher.code;
    } else {
      // Generate new discount code for exit intent (shorter validity - 7 days)
      const exitDiscount = createWelcomeDiscount(email, discountPercentage, 7);
      discountCode = exitDiscount.code;

      // Store discount code in vouchers table
      const { error: voucherError } = await supabase
        .from("vouchers")
        .insert({
          code: exitDiscount.code,
          discount_type: 'percentage',
          discount_value: exitDiscount.discount_percentage,
          valid_from: exitDiscount.valid_from,
          valid_to: exitDiscount.valid_until,
          max_uses: 1, // Single use
          used_count: 0,
          description: `Exit intent discount for ${email}`,
          is_active: true
        });

      if (voucherError) {
        console.error("Error creating voucher:", voucherError);
        return NextResponse.json(
          { success: false, error: "Failed to create discount code" },
          { status: 500 }
        );
      }
    }

    // Render the exit intent email template
    const emailHtml = await render(
      React.createElement(ExitIntentEmail, {
        customerName: name,
        discountCode: discountCode,
        discountPercentage: discountPercentage,
      })
    );

    // Send the exit intent email
    await sendMail({
      to: email,
      subject: `Don't miss out! Your ${discountPercentage}% discount is waiting 🎁`,
      html: emailHtml,
    });

    // Optional: Store email in a prospects/leads table for marketing
    try {
      await supabase
        .from("prospects")
        .upsert(
          { 
            email, 
            name,
            source: 'exit_intent',
            discount_code: discountCode,
            created_at: new Date().toISOString()
          },
          { 
            onConflict: 'email',
            ignoreDuplicates: false 
          }
        );
    } catch (prospectError) {
      // Don't fail if prospects table doesn't exist - it's optional
      console.log("Prospects table not found - skipping prospect storage");
    }

    return NextResponse.json({
      success: true,
      message: "Discount code sent to your email!",
      discountCode: discountCode,
      discountPercentage: discountPercentage
    });

  } catch (error: any) {
    console.error("Error processing exit intent:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Something went wrong. Please try again.",
        details: error?.message 
      },
      { status: 500 }
    );
  }
}