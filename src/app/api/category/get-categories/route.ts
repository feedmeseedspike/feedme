import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL!}/category/get-categories`,
    {
      method: "GET",
    }
  );

  const data = await response.json();
  // console
  return NextResponse.json(data);
}
