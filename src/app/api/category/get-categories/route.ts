import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const response = await fetch(`${process.env.API_BASE_URL}/category/get-categories`, {
    method: 'GET',
  });

  const data = await response.json();
  // console
  return NextResponse.json(data);
}
