import { NextResponse } from "next/server";
import { getDeliveryLocations } from "@/app/(dashboard)/account/addresses/actions";

export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    const address = await getDeliveryLocations();
    return NextResponse.json({
      location: address,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
};
