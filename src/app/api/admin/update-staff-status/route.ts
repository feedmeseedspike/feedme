import { NextRequest, NextResponse } from "next/server";
import { updateStaffStatus } from "@/lib/actions/user.action";

export async function POST(req: NextRequest) {
  try {
    const { userId, isStaff } = await req.json();
    if (!userId || typeof isStaff !== "boolean") {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }
    const result = await updateStaffStatus(userId, isStaff);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Unknown error" }, { status: 500 });
  }
} 