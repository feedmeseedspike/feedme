import { NextResponse } from "next/server";
import { sendMail } from "@/utils/email/mailer";

export async function POST(req: Request) {
  try {
    const { to, subject, orderReference, reason } = await req.json();
    if (!to || !subject || !orderReference || !reason) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; background: #fff; max-width: 480px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 37px; margin-bottom: 8px;" />
        </div>
        <h2 style="color: #1B6013; margin-bottom: 12px;">${subject}</h2>
        <p style="font-size: 16px; color: #222;">Hello,</p>
        <p style="font-size: 15px; color: #444;">We regret to inform you that your order <b>${orderReference}</b> could not be completed.</p>
        <div style="background: #f8d7da; color: #842029; border: 1px solid #f5c2c7; border-radius: 6px; padding: 12px 16px; margin: 18px 0;">
          <strong>Reason:</strong> ${reason}
        </div>
        <p style="font-size: 15px; color: #444;">If you believe this is a mistake or need help, please contact our support team at <a href="mailto:orders.feedmeafrica@gmail.com" style="color: #1B6013; text-decoration: underline;">orders.feedmeafrica@gmail.com</a> or call <b>+2348088282487</b>.</p>
        <p style="font-size: 15px; color: #444;">You can try placing your order again at any time.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0 16px 0;" />
        <div style="text-align: center;">
          <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 15px; margin-top: 8px;" />
        </div>
        <p style="font-size: 13px; color: #888; text-align: center; margin-top: 12px;">Thank you for choosing FeedMe.</p>
      </div>
    `;

    await sendMail({
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 