import { NextResponse } from "next/server";
import { authMiddleware } from "middleware/auth";
import {
  deleteAddressAction,
  updateAddressAction,
} from "@/app/(dashboard)/account/addresses/actions";

export const dynamic = 'force-dynamic';

export const GET = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      // Extract ID from URL
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      
      if (!id) {
        return NextResponse.json(
          { message: "Address ID is required" },
          { status: 400 }
        );
      }

      // For now, return a simple response since getAddressById doesn't exist
      // You may need to implement this action or fetch from addresses list
      return NextResponse.json({
        success: true,
        message: "Get address by ID - implement getAddressById action",
        id,
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
    try {
      // Extract ID from URL
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      
      if (!id) {
        return NextResponse.json(
          { message: "Address ID is required" },
          { status: 400 }
        );
      }

      const address = await request.json();
      const updatedAddress = await updateAddressAction(id, address);
      
      return NextResponse.json({
        success: true,
        data: updatedAddress,
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

export const DELETE = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      // Extract ID from URL
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      
      if (!id) {
        return NextResponse.json(
          { message: "Address ID is required" },
          { status: 400 }
        );
      }

      await deleteAddressAction(id);
      
      return NextResponse.json({
        success: true,
        message: "Address deleted successfully",
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
