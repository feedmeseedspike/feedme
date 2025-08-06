import { NextResponse } from "next/server";
import { authMiddleware } from "middleware/auth";
import { signOutUser } from "@/lib/actions/auth.actions";

export const POST = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      const user = await signOutUser();
      return NextResponse.json(user);
    } catch (error: any) {
      console.error(error);
      return NextResponse.json(
        { message: "Server error", error: error.message },
        { status: 500 }
      );
    }
  }
);
