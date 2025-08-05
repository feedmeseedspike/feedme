import { NextResponse } from "next/server";
import { getToken } from "@/lib/actions/pushnotification.action";

export const POST = async (request: Request) => {
  const {
    token,
    userid,
    type,
  }: { token: string; userid: string; type: "web" | "mobile" } =
    await request.json();
  try {
    const user = await getToken(userid, token, type);
    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
};