import { NextResponse } from "next/server";
import { getActiveJobs } from "@/lib/actions/careers.actions";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const jobs = await getActiveJobs();
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Failed to fetch active jobs:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array on error
  }
}