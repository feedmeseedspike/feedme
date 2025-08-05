import { checkToken } from "@/lib/actions/pushnotification.action";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  try {
    const { type, userId }: { userId: string; type: "web" | "mobile" } =
      await request.json();
    const response = await checkToken(userId, type);
    if (response) {
      return NextResponse.json(response);
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
};
