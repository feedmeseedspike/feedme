import { signInUser } from "@/lib/actions/auth.actions";
import { sendPushNotification } from "@/lib/actions/pushnotification.action";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data: {
      email: string;
      password: string;
    } = await request.json();
    const products = await signInUser(data);
    const user: any = products;
    // Only return id, slug, name, image
    console.log(user);
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
