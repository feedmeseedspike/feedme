// lib/parser.ts
interface ParsedProduct {
  categoryTitle: string;
  name: string;
  discount?: string;
  options: { name: string; price: number; oldPrice?: number }[];
}

export function parseFeedMeSheet(
  rows: any[][],
  defaultImage: string
): ParsedProduct[] {
  if (rows.length < 1) return [];

  // Auto-detect header row: look for 'food item' in row 0 or row 1
  const headerRowIdx = rows.findIndex(row =>
    row.some((h: any) => h?.toString().toLowerCase().trim() === 'food item')
  );
  if (headerRowIdx === -1) throw new Error('Could not find header row (Expected a row with "Food Item" column)');

  const headers = rows[headerRowIdx];
  const dataStartRow = headerRowIdx + 1;

  const col = (name: string) => {
    const n = name.toLowerCase();
    // Try exact first
    let idx = headers.findIndex((h) => h?.toString().toLowerCase().trim() === n);
    if (idx === -1) {
      // For price, be very specific to avoid picking up historical price columns
      if (n === 'new price') {
         idx = headers.findIndex((h) => h?.toString().toLowerCase().trim() === 'new price');
      } else if (n === 'old price') {
         idx = headers.findIndex((h) => h?.toString().toLowerCase().trim() === 'old price');
      } else {
         idx = headers.findIndex((h) => h?.toString().toLowerCase().includes(n));
      }
    }
    return idx;
  };

  const catIdx = col("categories");
  const itemIdx = col("food item");
  const qtyIdx = col("quantity");
  const newPriceIdx = headers.findIndex(h => h?.toString().toLowerCase().trim() === "new price");
  const oldPriceIdx = headers.findIndex(h => h?.toString().toLowerCase().trim() === "old price");
  const discountIdx = col("discount");

  if (catIdx === -1 || itemIdx === -1 || qtyIdx === -1 || newPriceIdx === -1) {
    throw new Error("Required columns not found (Expected: Categories, Food Item, Quantity, and NEW PRICE)");
  }

  const products: ParsedProduct[] = [];
  let currentCat = "";
  let currentItem = ""; 

  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawCategory = row[catIdx]?.toString().trim();
    const foodItemInRow = row[itemIdx]?.toString().trim();
    const quantity = row[qtyIdx]?.toString().trim();
    const newPriceStr = row[newPriceIdx]?.toString().trim();
    const oldPriceStr = oldPriceIdx !== -1 ? row[oldPriceIdx]?.toString().trim() : undefined;
    const discountStr = discountIdx !== -1 ? row[discountIdx]?.toString().trim() : undefined;

    // Update state only if we have data in the first few columns
    // This prevents deep side-table rows from hijacking the state.
    if (rawCategory) currentCat = rawCategory;
    if (foodItemInRow) currentItem = foodItemInRow;
    
    // A valid produce entry MUST have a quantity and a price in the main table area.
    // If the first 3 columns are empty, it's very likely noise from the right side of the sheet.
    if (!rawCategory && !foodItemInRow && !quantity) {
      continue;
    }

    // A valid entry must have a quantity and at least one price (New or Old)
    if (!quantity || (!newPriceStr && !oldPriceStr)) {
      continue;
    }

    // Clean and parse prices
    // If NEW PRICE is missing, fallback to OLD PRICE as the current price
    const effectiveNewPriceStr = newPriceStr || oldPriceStr || "";
    const price = parseFloat(effectiveNewPriceStr.replace(/[^0-9.]/g, ""));
    const oldPrice = oldPriceStr ? parseFloat(oldPriceStr.replace(/[^0-9.]/g, "")) : undefined;
    
    // Safety Threshold: Skip zero, NaN, or obvious outliers
    if (isNaN(price) || price <= 0 || price >= 1000000) {
      continue;
    }

    // Use current item name if this is an option row (empty item col)
    let foodItem = foodItemInRow || currentItem;
    if (!foodItem) continue;

    const finalCat = currentCat || "Uncategorized";

    let product = products.find(
      (p) => p.name === foodItem && p.categoryTitle === finalCat
    );

    if (!product) {
      product = { categoryTitle: finalCat, name: foodItem, options: [] };
      if (discountStr) product.discount = discountStr;
      products.push(product);
    } else if (!product.discount && discountStr) {
      product.discount = discountStr;
    }

    // Add unique options only
    const cleanQty = quantity.trim();
    if (!product.options.some(o => o.name === cleanQty)) {
       product.options.push({ name: cleanQty, price, oldPrice: isNaN(oldPrice as number) ? undefined : oldPrice });
    }
  }

  return products;
}
