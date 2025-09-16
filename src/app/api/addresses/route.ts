import { NextResponse } from "next/server";
import { authMiddleware } from "middleware/auth";
import {
  addAddressAction,
  deleteAddressAction,
  getAddressesForCurrentUser,
  updateAddressAction,
} from "@/app/(dashboard)/account/addresses/actions";

export const GET = authMiddleware(async () => {
  try {
    const address = await getAddressesForCurrentUser();
    return NextResponse.json({
      address,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
});

export const POST = authMiddleware(
  async (request: Request, user_id: string) => {
    const address  = await request.json();
    console.log({address})
    try {
      const user = await addAddressAction(address);
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
  }
);

export const PATCH = authMiddleware(
  async (request: Request, user_id: string) => {
    const { address, id } = await request.json();
    try {
      const user = await updateAddressAction(id, address);
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
  }
);
