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
    console.log(body)
    const { firstName, lastName, email, subject, message } = body;

    const adminEmail = process.env.NODEMAILER_USER;
    if (!adminEmail) {
      throw new Error("No admin/support email configured in CONTACT_EMAIL or NODEMAILER_USER env variable.");
    }
    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
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