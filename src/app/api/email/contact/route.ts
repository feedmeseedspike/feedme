import { NextResponse } from "next/server";
import { sendMail } from "@/utils/email/mailer";

interface ContactEmailRequestBody {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ContactEmailRequestBody;
    const { firstName, lastName, email, subject, message } = body;

    const adminEmail = "oyedelejeremiah.ng@gmail.com";
    if (!adminEmail) {
      throw new Error("No admin/support email configured in CONTACT_EMAIL or NODEMAILER_USER env variable.");
    }

    // Waitlist signup: only email provided
    if (email && !firstName && !lastName && !subject && !message) {
      // Send thank you email to user
      const thankYouHtml = `
        <div style="font-family: Arial, sans-serif; background: #fff; max-width: 480px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 37px; margin-bottom: 8px;" />
          </div>
          <h2 style="color: #1B6013; margin-bottom: 12px;">Thanks for Joining the FeedMe Community!</h2>
          <p style="font-size: 15px; color: #222;">We're excited to have you on board. You'll be the first to hear about updates, new features, and exclusive offers from FeedMe.</p>
          <p style="font-size: 15px; color: #444;">If you have any questions, feel free to reply to this email or contact our support team at <a href="mailto:seedspikelimited@gmail.com" style="color: #1B6013; text-decoration: underline;">seedspikelimited@gmail.com</a>.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0 16px 0;" />
          <div style="text-align: center;">
            <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 15px; margin-top: 8px;" />
          </div>
          <p style="font-size: 13px; color: #888; text-align: center; margin-top: 12px;">Thank you for joining FeedMe.</p>
        </div>
      `;
      await sendMail({
        to: email,
        subject: "Welcome to the FeedMe Community!",
        html: thankYouHtml,
      });
      // Notify admin
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; background: #fff; max-width: 480px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 37px; margin-bottom: 8px;" />
          </div>
          <h2 style="color: #1B6013; margin-bottom: 12px;">New Waitlist Signup</h2>
          <p style="font-size: 15px; color: #222;">A new user has joined the FeedMe community waitlist.</p>
          <div style="font-size: 15px; color: #222; margin-bottom: 18px;">
            <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #1B6013; text-decoration: underline;">${email}</a></p>
          </div>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0 16px 0;" />
          <div style="text-align: center;">
            <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 15px; margin-top: 8px;" />
          </div>
          <p style="font-size: 13px; color: #888; text-align: center; margin-top: 12px;">FeedMe Waitlist Notification</p>
        </div>
      `;
      await sendMail({
        to: adminEmail as string,
        subject: `Waitlist Signup: ${email}`,
        html: adminHtml,
      });
      return NextResponse.json({ success: true });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; background: #fff; max-width: 480px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 37px; margin-bottom: 8px;" />
        </div>
        <h2 style="color: #1B6013; margin-bottom: 12px;">New Contact Form Submission</h2>
        <div style="font-size: 15px; color: #222; margin-bottom: 18px;">
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #1B6013; text-decoration: underline;">${email}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        <div style="background: #f6f6f6; border-radius: 6px; padding: 14px 16px; color: #444; border: 1px solid #eaeaea; margin-bottom: 18px;">
          <p style="margin: 0; white-space: pre-line;"><strong>Message:</strong><br/>${message}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0 16px 0;" />
        <div style="text-align: center;">
          <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 15px; margin-top: 8px;" />
        </div>
        <p style="font-size: 13px; color: #888; text-align: center; margin-top: 12px;">FeedMe Contact Form Notification</p>
      </div>
    `;

    await sendMail({
      to: adminEmail as string,
      subject: `Contact Form: ${subject}`,
      html,
      from: email,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 