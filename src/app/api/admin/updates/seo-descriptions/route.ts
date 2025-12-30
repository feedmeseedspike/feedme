
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@utils/supabase/server";
import fs from "fs";
import path from "path";

// Define the path to the CSV file
const CSV_FILE_PATH = "c:\\Users\\DELL\\OneDrive - theofficedeveloper\\Desktop\\Personal\\feedme-v2\\FeedMe website SEO_ wrtitng optimisation - FeedMe Website (1).csv";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      return NextResponse.json({ error: "CSV file not found at " + CSV_FILE_PATH }, { status: 404 });
    }

    // 1. Fetch all bundles for lookup
    const { data: bundles, error: bundlesError } = await supabase
      .from('bundles')
      .select('id, name');
    
    if (bundlesError) throw new Error("Failed to fetch bundles: " + bundlesError.message);
    
    // Normalize bundle names for easier matching: "Jollof Rice" -> "jollofrice"
    const bundleMap = new Map();
    bundles?.forEach(b => {
        if (b.name) bundleMap.set(b.name.toLowerCase().replace(/[^a-z0-9]/g, ''), b.id);
    });

    // 2. Fetch all products to map Slug -> ID
    // We need IDs to insert into product_relations
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, slug');

    if (productsError) throw new Error("Failed to fetch products: " + productsError.message);
    
    const productMap = new Map();
    products?.forEach(p => {
        if (p.slug) productMap.set(p.slug, p.id);
    });

    // Read file content
    const fileContent = fs.readFileSync(CSV_FILE_PATH, "utf-8");
    
    // Parse CSV more robustly to handle commas inside quotes
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;
    
    // Simple state machine for CSV parsing
    for (let i = 0; i < fileContent.length; i++) {
        const char = fileContent[i];
        const nextChar = fileContent[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Escaped quote
                currentCell += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            // End of cell
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\r' || char === '\n') && !insideQuotes) {
            // End of row
            if (currentCell || currentRow.length > 0) { // Don't push empty rows from trailing newlines
                 currentRow.push(currentCell.trim());
                 rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
            // Handle \r\n
            if (char === '\r' && nextChar === '\n') i++;
        } else {
            currentCell += char;
        }
    }
    // Push last row if exists
    if (currentRow.length > 0 || currentCell) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }

    const updates = [];
    const errors = [];
    const skipped = [];
    const recipeLinks = [];

    // Start from index 1 to skip header
    for (let i = 1; i < rows.length; i++) {
      const columns = rows[i];

      if (columns.length < 5) {
          skipped.push({ line: i + 1, reason: `Not enough columns (Got ${columns.length})`, content: columns.join("|").substring(0, 50) });
          continue;
      }

      const link = columns[1];
      const description = columns[3]; // "On-Page Description"
      const recipeRaw = columns[4]; // "product page recipe"
      const metaDescription = columns[6]; // "Meta Description"
      
      if (!link) {
          skipped.push({ line: i + 1, reason: "Empty link" });
          continue;
      }

      if (!link.includes("/product/")) {
          // Check if it might be a homepage or other link
          skipped.push({ line: i + 1, reason: `Not a product link: ${link}` });
          continue;
      }
      
      // Extract slug
      // https://www.shopfeedme.com/product/alaska -> alaska
      const parts = link.split("/product/");
      if (parts.length < 2) {
          skipped.push({ line: i + 1, reason: "Could not extract slug" });
          continue;
      }
      
      const slugRaw = parts[1].split("/")[0].split("?")[0].trim();
      const slug = slugRaw.replace(/['"]+/g, '');
      
      if (!slug) {
         skipped.push({ line: i + 1, reason: "Empty slug" });
         continue;
      }

      const productId = productMap.get(slug);
      if (!productId) {
         skipped.push({ line: i + 1, reason: `Product not found in DB: ${slug}` });
         continue;
      }

      // Update Database - Description
      const updateData: any = {};
      if (description) updateData.description = description;
      if (metaDescription) updateData.meta_description = metaDescription;

      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", productId);

      if (error) {
        errors.push({ slug, error: error.message });
      } else {
        updates.push({ 
            slug, 
            description_length: description?.length || 0,
            meta_description_length: metaDescription?.length || 0
        });
      }

      // Process Recipes
      // Combine explicit recipe column WITH product name hinting
      // checking if product name itself implies a bundle link
      let cleanRecipes = "";
      if (recipeRaw && recipeRaw.trim()) {
           cleanRecipes = recipeRaw.replace(/^(Recipes? -|Recipe -)/i, '').trim();
      }
      
      const recipeNames = cleanRecipes.split(/,|;|\s+or\s+/).map(r => r.trim()).filter(r => r.length > 0);

      // Add product slug/name as a potential keyword to match against
      // e.g. if slug is 'egusi', add 'egusi' to list if not present
      const slugKey = slug.replace(/-/g, ' ');
      if (!recipeNames.includes(slugKey)) {
         recipeNames.push(slugKey);
      }
      
      if (recipeNames.length > 0) {
          for (const name of recipeNames) {
              const searchName = name.toLowerCase();
              
              // Fuzzy match: Find a bundle whose name includes the recipe name or vice-versa
              // "Jollof Rice" from CSV should match "Jollof Rice Bundle" from DB
              let matchedBundleId = null;
              let matchedBundleName = '';

              for (const [bName, bId] of bundleMap.entries()) {
                  // bName is already normalized/lowercase from earlier map creation, 
                  // but let's look at the original names if we stored them, 
                  // actually strictly using the normalized map keys might be too aggressive if we stripping chars.
                  // Let's use the raw bundle list for better matching.
              }
              
              const bestMatch = bundles?.find(b => {
                 const bName = (b.name || '').toLowerCase();
                 return bName.includes(searchName) || searchName.includes(bName);
              });

              if (bestMatch) {
                  matchedBundleId = bestMatch.id;
                  matchedBundleName = bestMatch.name || '';
              }

              if (!matchedBundleId) {
                  // If fuzzy match failed, try manual keyword mapping
                  const keywordMap: { [key: string]: string } = {
                      "jollof": "fried rice", // Maps to Fried Rice Pack
                      "fried rice": "fried rice",
                      "coconut": "fried rice",
                      "soup": "egusi", // Maps to Egusi Essence Bundle
                      "stew": "egusi",
                      "egusi": "egusi",
                      "ogbono": "egusi",
                      "peppersoup": "egusi",
                      "pepper soup": "egusi",
                      "efo": "efo-riro", // Maps to Efo-riro Royale
                      "vegetable": "efo-riro",
                      "village rice": "efo-riro",
                      "chicken": "protein", // Maps to Full Protein Pack
                      "turkey": "protein",
                      "goat": "protein",
                      "meat": "protein",
                      "fish": "protein",
                      "asun": "protein",
                      "grill": "protein",
                      "fruit": "fruits", // Maps to Fruits combo
                      "beans": "mini", // Maps to Mini Bundle? Or just general
                      "porridge": "mini",
                      "moi": "mini",
                      "akara": "mini"
                  };
                  
                  for (const [key, value] of Object.entries(keywordMap)) {
                      if (searchName.includes(key)) {
                           const keywordMatch = bundles?.find(b => (b.name || '').toLowerCase().includes(value));
                           if (keywordMatch) {
                               matchedBundleId = keywordMatch.id;
                               matchedBundleName = keywordMatch.name || '';
                               break;
                           }
                      }
                  }
              }

              if (matchedBundleId) {
                  // Link them
                  const { error: linkError } = await supabase
                    .from('product_relations')
                    .upsert({
                        source_product_id: productId,
                        target_product_id: matchedBundleId,
                        relation_type: 'related'
                    }, { onConflict: 'source_product_id, target_product_id' });

                  if (linkError) {
                      errors.push({ slug, action: 'link_recipe', recipe: name, error: linkError.message });
                  } else {
                      recipeLinks.push({ slug, bundle_searched: name, bundle_found: matchedBundleName });
                  }
              } else {
                  errors.push({ slug, action: 'find_recipe', recipe: name, error: "No matching bundle found in DB" });
              }
          }
      }
    }

    return NextResponse.json({
      message: "Update process completed",
      total_rows: rows.length - 1,
      successful_updates: updates.length,
      recipe_links_created: recipeLinks.length,
      failed_updates: errors.length,
      skipped_rows: skipped.length,
      details: {
        updates: updates.slice(0, 50),
        recipe_links: recipeLinks.slice(0, 50),
        errors,
        skipped: skipped.slice(0, 50),
        available_bundles: bundles?.map(b => b.name) || []
      }
    });

  } catch (error: any) {
    console.error("CSV Update Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
