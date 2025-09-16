import { registerUser } from "@/lib/actions/auth.actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data: {
      name: string;
      email: string;
      password: string;
      avatar_url?: string;
    } = await request.json();
    console.log(data)
    const products = await registerUser(data);
    // Only return id, slug, name, image
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
