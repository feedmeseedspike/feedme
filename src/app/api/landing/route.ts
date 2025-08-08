import { sendOffers } from "@/lib/actions/cart.actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data: {
      name: string;
      email: string;
      phone: string;
    } = await request.json();
    console.log("Received data:", data);
    const products = await sendOffers(data);
    // Only return id, slug, name, image
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
