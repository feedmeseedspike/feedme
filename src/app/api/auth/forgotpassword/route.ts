import { NextResponse } from "next/server";
import { authMiddleware } from "middleware/auth";
import { resetPassword } from "@/lib/actions/auth.actions";

export const PUT = authMiddleware(
  async (request: Request, user_id: string) => {
    const { newPassword } = await request.json();
    try {
      const user = await resetPassword(newPassword);
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
