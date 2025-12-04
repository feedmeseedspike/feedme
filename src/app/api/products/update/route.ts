import { supabase } from "@/lib/supabaseClient";

// app/api/products/update/route.ts
export async function GET() {
  const { data } = await supabase
    .from("products")
    .select("name, price, description, images")
    .order("name");

  return new Response(JSON.stringify({ products: data || [] }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      // This header forces Vercel to revalidate on every request
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}

// ADD THIS — forces dynamic rendering (critical!)
export const dynamic = "force-dynamic";
export const revalidate = 0;
