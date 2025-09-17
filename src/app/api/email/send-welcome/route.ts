import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { sendMail } from "@/utils/email/mailer";
import WelcomeEmail from "@/utils/email/welcomeEmail";
import React from "react";

interface WelcomeEmailRequest {
  customerName: string;
  customerEmail: string;
  discountCode: string;
  discountPercentage: number;
}

export async function POST(request: Request) {
  try {
    const body: WelcomeEmailRequest = await request.json();
    const { customerName, customerEmail, discountCode, discountPercentage } = body;

    if (!customerName || !customerEmail || !discountCode || !discountPercentage) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Render the welcome email template
    const emailHtml = await render(
      React.createElement(WelcomeEmail, {
        customerName,
        discountCode,
        discountPercentage,
      })
    );

    // Send the welcome email
    await sendMail({
      to: customerEmail,
      subject: `Welcome to FeedMe - Get ${discountPercentage}% off your first order!`,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: "Welcome email sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to send welcome email",
        details: error?.message 
      },
      { status: 500 }
    );
  }
}