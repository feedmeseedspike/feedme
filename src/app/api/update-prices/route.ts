// app/api/upload-excel/route.ts
import { parseFeedMeSheet } from "@/lib/parser";
import { slugify } from "@/lib/utils/index";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  findImageEntry,
  getProductImage,
  getOptionImage,
  DEFAULT_IMAGE,
  getFreshCategoryTag,
} from "@/lib/image-macher";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const BATCH_SIZE = 10;

// ──────────────────────────────────────────────────────────────────
// INTERFACES
// ──────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────
// DYNAMIC DESCRIPTION GENERATOR
// ──────────────────────────────────────────────────────────────────
function generateDescription(
  p: any,
  lowestPrice: number,
  highestPrice: number,
  categoryTitle: string
): string {
  const sizes = p.options.map((o: any) => o.name).join(", ");
  const priceRange =
    lowestPrice === highestPrice
      ? `₦${lowestPrice.toLocaleString()}`
      : `₦${lowestPrice.toLocaleString()} – ₦${highestPrice.toLocaleString()}`;

  const isGeneral = categoryTitle.toLowerCase() === "general";
  const categoryHint = isGeneral ? "" : ` in our ${categoryTitle} collection`;

  let tagline = "High-quality, affordable, and ready to enjoy.";
  const nameLower = p.name.toLowerCase();
  if (nameLower.includes("fresh"))
    tagline = "Freshly sourced and packed with flavor.";
  else if (nameLower.includes("premium"))
    tagline = "Premium quality, hand-selected for you.";
  else if (nameLower.includes("organic"))
    tagline = "100% organic and naturally grown.";

  return (
    `${p.name} available in ${p.options.length} size${p.options.length > 1 ? "s" : ""}: ${sizes}. ` +
    `Choose your perfect portion at ${priceRange}.${categoryHint} ` +
    `${tagline} Order now for fast delivery!`
  );
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

    // DEBUG
    if (parsedProducts.length > 0) {
      console.log("SAMPLE PARSED PRODUCT:", {
        categoryTitle: parsedProducts[0].categoryTitle,
        name: parsedProducts[0].name,
        optionCount: parsedProducts[0].options.length,
      });
    }

    // FETCH GENERAL CATEGORY
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

    // ─────────────────────────────────────────────────────────────
    // TRACK PRODUCTS IN CSV FOR OUT-OF-STOCK DETECTION
    // ─────────────────────────────────────────────────────────────
    const productsInCSV = new Set(parsedProducts.map(p => p.name));
    let totalInserted = 0;
    let totalMarkedOutOfStock = 0;

    for (let i = 0; i < parsedProducts.length; i += BATCH_SIZE) {
      const batch = parsedProducts.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${i / BATCH_SIZE + 1} (${batch.length} items)`
      );

      for (const p of batch) {
        const lowestPrice = Math.min(...p.options.map((o: any) => o.price));
        const highestPrice = Math.max(...p.options.map((o: any) => o.price));
        const sheetCatLower = (p.categoryTitle || "").toLowerCase();
        const categoryTitle =
          sheetCatLower && catMap.has(sheetCatLower)
            ? p.categoryTitle
            : "General";
        let categoryId = GENERAL_CATEGORY_ID;

        if (sheetCatLower && catMap.has(sheetCatLower)) {
          categoryId = catMap.get(sheetCatLower)!;
          console.log(`Matched: "${p.categoryTitle}" → ${categoryId}`);
        } else {
          console.log(`No match: "${p.categoryTitle}" → using General`);
        }

        // ─────────────────────────────────────────────────────────────
        // IMAGE & TAGS LOOKUP
        // ─────────────────────────────────────────────────────────────
        const imgEntry = findImageEntry(p.name);
        const productMainImg = getProductImage(imgEntry);
        const optionImg = getOptionImage(imgEntry);
        const tags = getFreshCategoryTag(p.categoryTitle); // null if empty

        // FETCH EXISTING PRODUCT
        const { data: existing } = await supabase
          .from("products")
          .select("id, options, price, list_price, images, tags, stock_status, in_season")
          .eq("name", p.name)
          .single();

        // Merge existing tags with new generated tags
        const existingTags = existing?.tags || [];
        const newTags = tags || [];
        const mergedTags = Array.from(new Set([...existingTags, ...newTags]));

        const updateData: any = {
          price: lowestPrice,
          list_price: highestPrice,
          category_ids: [categoryId, GENERAL_CATEGORY_ID],
          stock_status: "in_stock", // ← Mark as in stock since it's in the CSV
          tags: mergedTags,
        };

        // ─────────────────────────────────────────────────────────────
        // UPDATE EXISTING PRODUCT
        // ─────────────────────────────────────────────────────────────
        if (existing) {
          console.log(`UPDATING: "${p.name}"`);

          const updatedOptions = (existing.options || []).map((opt: any) => {
            const newOpt = p.options.find((o: any) => o.name === opt.name);
            if (newOpt) {
              return {
                ...opt,
                price: newOpt.price,
                list_price: newOpt.price,
                image: optionImg,
                stockStatus: "In Stock", // ← Mark option as in stock
              };
            }
            return opt;
          });

          p.options.forEach((newOpt: any) => {
            if (!updatedOptions.some((o: any) => o.name === newOpt.name)) {
              updatedOptions.push({
                name: newOpt.name,
                image: optionImg,
                price: newOpt.price,
                list_price: newOpt.price,
                stockStatus: "In Stock",
              });
            }
          });

          updateData.options = updatedOptions;

          const currentImgs = existing.images ?? [];
          if (currentImgs.length === 1 && currentImgs[0] === DEFAULT_IMAGE) {
            updateData.images = [productMainImg];
          }

          const { error } = await supabase
            .from("products")
            .update(updateData)
            .eq("id", existing.id);

          if (error) {
            console.error(`Update failed for ${p.name}:`, error.message);
          } else {
            console.log(
              `Updated ${p.name}: ${p.options.length} options synced, marked IN STOCK`
            );
          }
        }
        // ─────────────────────────────────────────────────────────────
        // INSERT NEW PRODUCT
        // ─────────────────────────────────────────────────────────────
        else {
          console.log(`CREATING: "${p.name}"`);

          const newProduct: ProductInsert = {
            name: p.name,
            slug: slugify(p.name),
            description: generateDescription(
              p,
              lowestPrice,
              highestPrice,
              categoryTitle
            ),
            price: lowestPrice,
            list_price: highestPrice,
            brand: null,
            avg_rating: 0.0,
            num_reviews: null,
            num_sales: 0,
            count_in_stock: null,
            stock_status: "in_stock", // ← New products are in stock
            is_published: true,
            vendor_id: null,
            category_ids: [categoryId, GENERAL_CATEGORY_ID],
            tags,
            images: [productMainImg],
            options: p.options.map((o: any) => ({
              name: o.name,
              image: optionImg,
              price: o.price,
              list_price: o.price,
              stockStatus: "In Stock",
            })),
            rating_distribution: {},
            in_season: null, // ← Admin will set this manually
          };

          const { error } = await supabase
            .from("products")
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

    // ─────────────────────────────────────────────────────────────
    // MARK PRODUCTS NOT IN CSV AS OUT OF STOCK
    // ─────────────────────────────────────────────────────────────
    console.log("\n🔍 Checking for products missing from CSV...");
    const { data: allProducts } = await supabase
      .from("products")
      .select("id, name, stock_status");

    if (allProducts) {
      for (const product of allProducts) {
        if (!productsInCSV.has(product.name) && product.stock_status !== "out_of_stock") {
          const { error } = await supabase
            .from("products")
            .update({ stock_status: "out_of_stock" })
            .eq("id", product.id);

          if (!error) {
            console.log(`❌ Marked OUT OF STOCK: "${product.name}"`);
            totalMarkedOutOfStock++;
          }
        }
      }
    }


    console.log(`\n✅ IMPORT COMPLETE: ${totalInserted} products processed`);
    console.log(`📦 ${totalMarkedOutOfStock} products marked OUT OF STOCK (not in CSV)`);
    
    return NextResponse.json({ 
      success: true, 
      total: totalInserted,
      markedOutOfStock: totalMarkedOutOfStock,
      message: `Updated ${totalInserted} products. ${totalMarkedOutOfStock} products marked out of stock.`
    });
  } catch (error: any) {
    console.error("FATAL ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
