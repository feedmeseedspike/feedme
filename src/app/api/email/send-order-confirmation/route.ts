import { NextResponse } from "next/server";
import { sendOrderConfirmationEmails } from "@/utils/email/sendOrderEmail";

interface OrderEmailRequestBody {
  adminEmail: string;
  userEmail: string;
  adminOrderProps: any;
  userOrderProps: any;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as OrderEmailRequestBody;
    console.log('📧 Order email request:', body);
    
    await sendOrderConfirmationEmails(body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Order email failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
