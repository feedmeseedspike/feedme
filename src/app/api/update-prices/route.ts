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
import { similarity } from "@/lib/similarity";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_FILE_SIZE = 50 * 1024 * 1024;

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const isDryRun = formData.get("dryRun") === "true";
    const confirmationsRaw = formData.get("confirmations") as string | null;
    const confirmations = confirmationsRaw ? JSON.parse(confirmationsRaw) : {};

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    if (file.size > MAX_FILE_SIZE)
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    const isXlsx = file.name.endsWith(".xlsx");
    const isCsv = file.name.endsWith(".csv");
    if (!isXlsx && !isCsv)
      return NextResponse.json({ error: "Only .xlsx or .csv files are accepted" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    // For .xlsx, prefer the named sheet; for .csv, use first sheet
    let sheet = isXlsx
      ? workbook.Sheets["FeedMe Updated Prices"]
      : workbook.Sheets[workbook.SheetNames[0]];
    // Fallback: if named sheet not found in xlsx, try first sheet
    if (!sheet && isXlsx) sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet)
      return NextResponse.json({ error: "Could not read sheet" }, { status: 400 });

    const raw: any = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const parsedProducts = parseFeedMeSheet(raw, DEFAULT_IMAGE);

    if (parsedProducts.length === 0)
      return NextResponse.json({ error: "No data found in sheet" }, { status: 400 });

    // FETCH ALL RELEVANT DATA FROM DB
    const [{ data: allExistingProducts }, { data: allCats }] = await Promise.all([
      supabase.from("products").select("id, name, options, price, list_price, images, tags, stock_status, in_season"),
      supabase.from("categories").select("id, title")
    ]);

    const catMap = new Map(allCats?.map((c) => [c.title.toLowerCase(), c.id]) || []);
    const generalCat = allCats?.find(c => c.title === "General");
    if (!generalCat) return NextResponse.json({ error: "General category missing" }, { status: 500 });
    const GENERAL_CATEGORY_ID = generalCat.id;

    if (isDryRun) {
      const analysis = parsedProducts.map(p => {
        const lowestPrice = Math.min(...p.options.map((o: any) => o.price));
        const highestPrice = Math.max(...p.options.map((o: any) => o.price));
        
        const exact = allExistingProducts?.find(ep => ep.name === p.name);
        
        const result: any = { 
          csvItem: p.name, 
          newPrice: lowestPrice,
          newPriceMax: highestPrice
        };

        if (exact) {
          result.status = "exact_match";
          result.matchId = exact.id;
          result.matchName = exact.name;
          result.oldPrice = exact.price;
        } else {
          // Fuzzy match
          let bestMatch: any = null;
          let highestSim = 0;
          allExistingProducts?.forEach(ep => {
            const sim = similarity(p.name, ep.name);
            if (sim > highestSim) {
              highestSim = sim;
              bestMatch = ep;
            }
          });

          if (highestSim > 0.7) {
            result.status = "potential_rename";
            result.matchId = bestMatch.id;
            result.matchName = bestMatch.name;
            result.similarity = highestSim;
            result.oldPrice = bestMatch.price;
          } else {
            result.status = "new";
            if (highestSim > 0.4) {
              result.suggestion = { id: bestMatch.id, name: bestMatch.name, similarity: highestSim, oldPrice: bestMatch.price };
            }
          }
        }

        return result;
      });

      return NextResponse.json({ 
        success: true, 
        dryRun: true, 
        analysis,
        totalParsed: parsedProducts.length 
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTUAL EXECUTION (CONFIRMED)
    // ─────────────────────────────────────────────────────────────
    let totalInserted = 0;
    let totalUpdated = 0;
    const finalProductsInCSVNames = new Set<string>();

    for (const p of parsedProducts) {
      // Find the option that defines the 'lowest price' to use its oldPrice for the product-level list_price
      const lowestPriceOption = p.options.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
      const lowestPrice = lowestPriceOption.price;
      
      // Calculate a sensible product-level list_price:
      // If the lowest price option has an oldPrice > currentPrice, use it as list_price.
      // Otherwise fallback to highest price (existing behavior for price range) or same as price if no range.
      let productListPrice = (lowestPriceOption.oldPrice && lowestPriceOption.oldPrice > lowestPrice) 
        ? lowestPriceOption.oldPrice 
        : Math.max(...p.options.map((o: any) => o.price));

      const sheetCatLower = (p.categoryTitle || "").toLowerCase();
      const categoryId = catMap.get(sheetCatLower) || GENERAL_CATEGORY_ID;
      const categoryTitle = sheetCatLower && catMap.has(sheetCatLower) ? p.categoryTitle : "General";

      const imgEntry = findImageEntry(p.name);
      const productMainImg = getProductImage(imgEntry);
      const optionImg = getOptionImage(imgEntry);
      const tags = getFreshCategoryTag(p.categoryTitle);

      let existing = allExistingProducts?.find(ep => ep.name === p.name);
      
      const conf = confirmations[p.name];
      if (conf?.action === 'ignore') continue;
      if (!existing && conf?.action === 'rename') {
        const targetId = conf.targetId;
        existing = allExistingProducts?.find(ep => ep.id === targetId);
      }

      const existingTags = existing?.tags || [];
      const newTags = tags || [];
      const combinedWithoutDiscount = [...existingTags, ...newTags].filter(
        (t) => typeof t === "string" && !t.toLowerCase().startsWith("discount:")
      );
      const mergedTags = Array.from(new Set(combinedWithoutDiscount));

      if ((p as any).discount) {
        mergedTags.push(`Discount: ${(p as any).discount}`);
      }

      const updateData: any = {
        name: p.name,
        price: lowestPrice,
        list_price: productListPrice,
        category_ids: [categoryId, GENERAL_CATEGORY_ID],
        stock_status: "in_stock",
        tags: mergedTags,
      };

      if (existing) {
        const updatedOptions = (existing.options || []).map((opt: any) => {
          const newOpt = p.options.find((o: any) => o.name === opt.name);
          if (newOpt) {
            // Use oldPrice from CSV if it's a discount, otherwise use new price
            const optListPrice = (newOpt.oldPrice && newOpt.oldPrice > newOpt.price) ? newOpt.oldPrice : newOpt.price;
            return { ...opt, price: newOpt.price, list_price: optListPrice, image: optionImg, stockStatus: "In Stock" };
          }
          // If option is missing from CSV, mark as Out of Stock
          return { ...opt, stockStatus: "Out of Stock" };
        });

        // Add brand new options found in CSV
        p.options.forEach((newOpt: any) => {
          if (!updatedOptions.some((o: any) => o.name === newOpt.name)) {
            const optListPrice = (newOpt.oldPrice && newOpt.oldPrice > newOpt.price) ? newOpt.oldPrice : newOpt.price;
            updatedOptions.push({ name: newOpt.name, image: optionImg, price: newOpt.price, list_price: optListPrice, stockStatus: "In Stock" });
          }
        });

        updateData.options = updatedOptions;
        const currentImgs = existing.images ?? [];
        if (currentImgs.length === 1 && currentImgs[0] === DEFAULT_IMAGE) {
          updateData.images = [productMainImg];
        }

        const { error } = await supabase.from("products").update(updateData).eq("id", existing.id);
        if (!error) {
          totalUpdated++;
          finalProductsInCSVNames.add(p.name);
        }
      } else {
        const newProduct: ProductInsert = {
          name: p.name,
          slug: slugify(p.name),
          description: generateDescription(p, lowestPrice, productListPrice, categoryTitle),
          price: lowestPrice,
          list_price: productListPrice,
          brand: null,
          avg_rating: 0.0,
          num_reviews: null,
          num_sales: 0,
          count_in_stock: null,
          stock_status: "in_stock",
          is_published: true,
          vendor_id: null,
          category_ids: [categoryId, GENERAL_CATEGORY_ID],
          tags: mergedTags,
          images: [productMainImg],
          options: p.options.map((o: any) => {
             const optListPrice = (o.oldPrice && o.oldPrice > o.price) ? o.oldPrice : o.price;
             return { name: o.name, image: optionImg, price: o.price, list_price: optListPrice, stockStatus: "In Stock" };
          }),
          rating_distribution: {},
          in_season: null,
        };
        const { error } = await supabase.from("products").insert(newProduct);
        if (!error) {
          totalInserted++;
          finalProductsInCSVNames.add(p.name);
        }
      }
    }


    // Mark missing products as out of stock
    let totalMarkedOutOfStock = 0;
    if (allExistingProducts) {
      for (const product of allExistingProducts) {
        // If it was renamed TO something else, it's covered by the new name in Set.
        // If it was NOT in the CSV and NOT target of a rename, mark OOS.
        const wasTargetOfRename = Object.values(confirmations).some((c: any) => c.action === 'rename' && c.targetId === product.id);
        if (!finalProductsInCSVNames.has(product.name) && !wasTargetOfRename && product.stock_status !== "out_of_stock") {
          const { error } = await supabase.from("products").update({ stock_status: "out_of_stock" }).eq("id", product.id);
          if (!error) totalMarkedOutOfStock++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      totalInserted,
      totalUpdated,
      markedOutOfStock: totalMarkedOutOfStock,
      message: `Updated ${totalUpdated} and created ${totalInserted} products. ${totalMarkedOutOfStock} marked out of stock.`
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
