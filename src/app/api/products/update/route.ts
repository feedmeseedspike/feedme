// app/api/products/route.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data } = await supabase
    .from("products_duplicate")
    .select("name, price, description, images")
    .order("name");

  return Response.json({ products: data || [] });
}
