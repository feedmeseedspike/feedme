import { NextResponse } from 'next/server';
import { getReferredUsers } from '@/queries/referrals';

export async function GET(request: Request) {
  try {
    const { data, message } = await getReferredUsers();

    if (message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!data) {
      return NextResponse.json({ message: message || "No referred users found." }, { status: 404 });
    }

    return NextResponse.json({ data, message }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in referred-users API:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
} 