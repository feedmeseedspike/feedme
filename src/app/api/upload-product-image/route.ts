import { NextRequest, NextResponse } from "next/server";
import { createClient } from "src/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const bucket = (formData.get("bucket") as string) || "product-images";
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const supabase = await createClient();
  const fileExt = (file as File).name.split(".").pop();
  const filePath = `${Date.now()}.${fileExt}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file as File);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  return NextResponse.json({ url: publicUrlData.publicUrl });
} 