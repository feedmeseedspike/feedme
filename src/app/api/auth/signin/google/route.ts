import { signinWithOAuth } from "@/lib/actions/auth.actions";
import { sendPushNotification } from "@/lib/actions/pushnotification.action";
import { SignInWithIdTokenCredentials } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data: {
      provider: SignInWithIdTokenCredentials["provider"];
      id: string;
    } = await request.json();
    const products = await signinWithOAuth(data.provider, data.id);
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
