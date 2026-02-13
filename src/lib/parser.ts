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
  if (rows.length < 2) return [];

  const headers = rows[1];

  const col = (name: string) => {
    const idx = headers.findIndex((h) =>
      h?.toString().toLowerCase().includes(name.toLowerCase())
    );
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
  let currentItem = ""; // Track last food item

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];

    const rawCategory = row[catIdx]?.toString().trim();
    let foodItem = row[itemIdx]?.toString().trim();
    const quantity = row[qtyIdx]?.toString().trim();
    const newPriceStr = row[newPriceIdx]?.toString().trim();

    // Update category
    if (rawCategory) {
      currentCat = rawCategory;
    }

    // Update current item if new food item
    if (foodItem) {
      currentItem = foodItem;
    }

    // Skip if no price
    if (!newPriceStr) {
      continue;
    }

    const price = parseFloat(newPriceStr.replace(/[^0-9.]/g, ""));
    if (isNaN(price)) {
      continue;
    }

    // Use last known item if blank
    if (!foodItem && currentItem) {
      foodItem = currentItem;
    } else if (!foodItem) {
      continue;
    }

    const finalCat = currentCat || "Uncategorized";

    let product = products.find(
      (p) => p.name === foodItem && p.categoryTitle === finalCat
    );

    if (!product) {
      product = { categoryTitle: finalCat, name: foodItem, options: [] };
      products.push(product);
    }

    product.options.push({ name: quantity || "Unknown", price });
  }

  return products;
}
