// lib/parser.ts
interface ParsedProduct {
  categoryTitle: string;
  name: string;
  options: { name: string; price: number }[];
}

export function parseFeedMeSheet(
  rows: any[][],
  defaultImage: string
): ParsedProduct[] {
  console.log("Starting parser...");
  if (rows.length < 2) return [];

  const headers = rows[1];
  console.log("Headers:", headers);

  const col = (name: string) => {
    const idx = headers.findIndex((h) =>
      h?.toString().toLowerCase().includes(name.toLowerCase())
    );
    console.log(`Column "${name}" → index: ${idx}`);
    return idx;
  };

  const catIdx = col("categories");
  const itemIdx = col("food item");
  const qtyIdx = col("quantity");
  const newPriceIdx = col("new price");

  if ([catIdx, itemIdx, qtyIdx, newPriceIdx].some((i) => i === -1)) {
    throw new Error("Required columns not found");
  }

  const products: ParsedProduct[] = [];
  let currentCat = "";
  let currentItem = ""; // ← TRACK LAST FOOD ITEM

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const rawCategory = row[catIdx]?.toString().trim();
    let foodItem = row[itemIdx]?.toString().trim();
    const quantity = row[qtyIdx]?.toString().trim();
    const newPriceStr = row[newPriceIdx]?.toString().trim();

    console.log(`Row ${rowNum}:`, {
      rawCategory,
      foodItem,
      quantity,
      newPriceStr,
    });

    // UPDATE CATEGORY
    if (rawCategory) {
      currentCat = rawCategory;
      console.log(`→ Category: "${currentCat}"`);
    }

    // UPDATE CURRENT ITEM IF NEW FOOD ITEM
    if (foodItem) {
      currentItem = foodItem;
      console.log(`→ New item: "${currentItem}"`);
    }

    // SKIP ONLY IF NO PRICE
    if (!newPriceStr) {
      console.log("→ Skipped: no price");
      continue;
    }

    const price = parseFloat(newPriceStr.replace(/[^0-9.]/g, ""));
    if (isNaN(price)) {
      console.log(`→ Skipped: invalid price "${newPriceStr}"`);
      continue;
    }

    // USE LAST KNOWN ITEM IF BLANK
    if (!foodItem && currentItem) {
      foodItem = currentItem;
    } else if (!foodItem) {
      console.log("→ Skipped: no food item and no current item");
      continue;
    }

    const finalCat = currentCat || "Uncategorized";

    let product = products.find(
      (p) => p.name === foodItem && p.categoryTitle === finalCat
    );

    if (!product) {
      product = { categoryTitle: finalCat, name: foodItem, options: [] };
      products.push(product);
      console.log(`→ NEW: "${foodItem}" → "${finalCat}"`);
    }

    product.options.push({ name: quantity || "Unknown", price });
    console.log(`→ Added: "${quantity}" @ ${price}`);
  }

  console.log(`Parser done. Found ${products.length} unique products`);
  return products;
}
