import { NextResponse } from "next/server";
import { sendMail } from "@/utils/email/mailer";
import { renderOrderEmails } from "@/utils/email/renderOrderEmails";

interface OrderEmailRequestBody {
  adminEmail: string;
  userEmail: string;
  adminOrderProps: any;
  userOrderProps: any;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as OrderEmailRequestBody;
    const { adminEmail, userEmail, adminOrderProps, userOrderProps } = body;

    const { adminHtml, userHtml } = await renderOrderEmails({ adminOrderProps, userOrderProps });

    // Send to admin
    await sendMail({
      to: adminEmail,
      subject: `New Order Received - ${adminOrderProps.orderNumber}`,
      html: adminHtml,
    });
    // Send to user
    await sendMail({
      to: userEmail,
      subject: `Order Confirmed! Your Fresh Produce is On Its Way` ,
      html: userHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 