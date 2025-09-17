import { NextResponse } from "next/server";
import { getAllBlogTags } from "@/lib/actions/blog.actions";

export async function GET() {
  try {
    const tags = await getAllBlogTags();
    
    return NextResponse.json({ tags, success: true });
  } catch (error) {
    console.error("Error fetching blog tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog tags", success: false }, 
      { status: 500 }
    );
  }
}