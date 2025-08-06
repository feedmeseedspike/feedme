import { NextResponse } from "next/server";
import { authMiddleware } from "middleware/auth";
import {
  addAddressAction,
  deleteAddressAction,
  getAddressesForCurrentUser,
  updateAddressAction,
} from "@/app/(dashboard)/account/addresses/actions";

export const DELETE = authMiddleware(
  async (request: Request, user_id: string) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    console.log(id);
    if (!id) {
      return NextResponse.json({});
    }

    try {
      const user = await deleteAddressAction(id);
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
