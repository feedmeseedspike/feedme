// app/api/upload-excel/route.ts
import { parseFeedMeSheet } from "@/lib/parser";
import { slugify } from "@/lib/utils/index";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! // ← FIXED: NO NEXT_PUBLIC HERE
);

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const BATCH_SIZE = 10;
const DEFAULT_IMAGE =
  "https://fyldgskqxrfmrhyluxmw.supabase.co/storage/v1/object/public/product-images/default-food.jpg";

interface Option {
  name: string;
  image: string;
  price: number;
  list_price: number;
  stockStatus: string;
}

interface ProductInsert {
  name: string;
  slug: string;
  description: string;
  price: number;
  list_price: number;
  brand: string | null;
  avg_rating: number;
  num_reviews: number | null;
  num_sales: number;
  count_in_stock: number | null;
  stock_status: string;
  is_published: boolean;
  vendor_id: string | null;
  category_ids: string[];
  tags: string[] | null;
  images: string[];
  options: Option[];
  rating_distribution: Record<string, number>;
  in_season: boolean | null;
}

console.log("API route /api/upload-excel is LOADED");

export async function POST(req: NextRequest) {
  console.log("Upload API called");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    if (file.size > MAX_FILE_SIZE)
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    if (!file.name.endsWith(".xlsx"))
      return NextResponse.json({ error: "Only .xlsx" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets["FeedMe Updated Prices"];
    if (!sheet)
      return NextResponse.json({ error: "Sheet not found" }, { status: 400 });

    const raw: any = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const parsedProducts = parseFeedMeSheet(raw, DEFAULT_IMAGE);

    if (parsedProducts.length === 0)
      return NextResponse.json({ error: "No data" }, { status: 400 });

    // DEBUG: SHOW FIRST PRODUCT AFTER PARSING
    if (parsedProducts.length > 0) {
      console.log("SAMPLE PARSED PRODUCT:", {
        categoryTitle: parsedProducts[0].categoryTitle,
        name: parsedProducts[0].name,
        optionCount: parsedProducts[0].options.length,
      });
    }

    // FETCH GENERAL + ALL CATEGORIES
    let GENERAL_CATEGORY_ID: string;
    const { data: generalCat } = await supabase
      .from("categories")
      .select("id")
      .eq("title", "General")
      .single();

    if (!generalCat) {
      console.error("General category missing");
      return NextResponse.json({ error: "General missing" }, { status: 500 });
    }
    GENERAL_CATEGORY_ID = generalCat.id;
    console.log(`General category ID: ${GENERAL_CATEGORY_ID}`);

    const { data: allCats } = await supabase
      .from("categories")
      .select("id, title");
    const catMap = new Map(
      allCats?.map((c) => [c.title.toLowerCase(), c.id]) || []
    );
    console.log(`Loaded ${catMap.size} categories`);

    let totalInserted = 0;

    // PROCESS ONE BY ONE (SAFER & SMARTER)
    for (let i = 0; i < parsedProducts.length; i += BATCH_SIZE) {
      const batch = parsedProducts.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${i / BATCH_SIZE + 1} (${batch.length} items)`
      );

      for (const p of batch) {
        const lowestPrice = Math.min(...p.options.map((o: any) => o.price));
        const sheetCatLower = (p.categoryTitle || "").toLowerCase();
        let categoryId = GENERAL_CATEGORY_ID;

        if (sheetCatLower && catMap.has(sheetCatLower)) {
          categoryId = catMap.get(sheetCatLower)!;
          console.log(`→ Matched: "${p.categoryTitle}" → ${categoryId}`);
        } else {
          console.log(`→ No match: "${p.categoryTitle}" → using General`);
        }

        // FETCH EXISTING PRODUCT
        const { data: existing, error: fetchErr } = await supabase
          .from("products_duplicate")
          .select("id, options, price, list_price")
          .eq("name", p.name)
          .single();

        const updateData: any = {
          price: lowestPrice,
          list_price: lowestPrice,
          category_ids: [categoryId, GENERAL_CATEGORY_ID],
        };

        if (existing) {
          console.log(`→ UPDATING: "${p.name}"`);

          // UPDATE EXISTING OPTIONS + ADD NEW ONES
          const updatedOptions = (existing.options || []).map((opt: any) => {
            const newOpt = p.options.find((o: any) => o.name === opt.name);
            if (newOpt) {
              return {
                ...opt,
                price: newOpt.price,
                list_price: newOpt.price,
              };
            }
            return opt; // keep old option if not in sheet
          });

          // ADD NEW OPTIONS FROM SHEET
          p.options.forEach((newOpt: any) => {
            if (!updatedOptions.some((o: any) => o.name === newOpt.name)) {
              updatedOptions.push({
                name: newOpt.name,
                image: DEFAULT_IMAGE,
                price: newOpt.price,
                list_price: newOpt.price,
                stockStatus: "In Stock",
              });
            }
          });

          updateData.options = updatedOptions;

          // UPDATE ONLY WHAT CHANGED
          const { error } = await supabase
            .from("products_duplicate")
            .update(updateData)
            .eq("id", existing.id);

          if (error) {
            console.error(`Update failed for ${p.name}:`, error.message);
          } else {
            console.log(
              `Updated ${p.name}: ${p.options.length} options synced`
            );
          }
        } else {
          console.log(`→ CREATING: "${p.name}"`);
          // FULL INSERT FOR NEW PRODUCT
          const newProduct: ProductInsert = {
            name: p.name,
            slug: slugify(p.name),
            description: `Fresh ${p.name} in ${p.options.length} sizes.`,
            price: lowestPrice,
            list_price: lowestPrice,
            brand: null,
            avg_rating: 0.0,
            num_reviews: null,
            num_sales: 0,
            count_in_stock: null,
            stock_status: "in_stock",
            is_published: true,
            vendor_id: null,
            category_ids: [categoryId, GENERAL_CATEGORY_ID],
            tags: null,
            images: [DEFAULT_IMAGE],
            options: p.options.map((o: any) => ({
              name: o.name,
              image: DEFAULT_IMAGE,
              price: o.price,
              list_price: o.price,
              stockStatus: "In Stock",
            })),
            rating_distribution: {},
            in_season: null,
          };

          const { error } = await supabase
            .from("products_duplicate")
            .insert(newProduct);

          if (error) {
            console.error(`Insert failed for ${p.name}:`, error.message);
          } else {
            console.log(`Created ${p.name}`);
          }
        }

        totalInserted++;
      }
    }

    console.log(`IMPORT COMPLETE: ${totalInserted} products processed`);
    return NextResponse.json({ success: true, total: totalInserted });
  } catch (error: any) {
    console.error("FATAL ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
