interface CustomizationOption {
  label: string;
  value: string;
  price_adjustment: number;
  default: boolean;
}

interface Customization {
  id: string;
  label: string;
  type: string;
  options: CustomizationOption[];
}

interface ParsedProduct {
  categoryTitle: string;
  name: string;
  discount?: string;
  options: { name: string; price: number; oldPrice?: number; stockStatus?: string }[];
  customizations?: Customization[];
}

function parseCustomizationCell(customStr: string): Customization | null {
  if (!customStr || !customStr.trim()) return null;
  const str = customStr.trim();
  let label = str;
  let rawOptions: string[] = [];

  if (str.includes(":")) {
    const parts = str.split(":");
    label = parts[0].trim();
    rawOptions = parts[1].split(/[,/|\n]/).map((s) => s.trim()).filter(Boolean);
  } else if (str.includes(",") || str.includes("/") || str.includes("|")) {
    const splitted = str.split(/[,/|\n]/).map((s) => s.trim()).filter(Boolean);
    label = splitted[0] || str;
    rawOptions = splitted;
  } else {
    label = str;
    rawOptions = [str];
  }

  if (rawOptions.length === 0) rawOptions = [label];

  const options: CustomizationOption[] = rawOptions.map((opt, idx) => ({
    label: opt,
    value: opt.toLowerCase().trim(),
    price_adjustment: 0,
    default: idx === 0,
  }));

  const cleanLabel = label.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const safeId = `custom_${cleanLabel || "option"}`;

  return {
    id: safeId,
    label: label,
    type: "select",
    options,
  };
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

  let catIdx = col("categories");
  const itemIdx = col("food item");
  const qtyIdx = col("quantity");
  const newPriceIdx = headers.findIndex(h => h?.toString().toLowerCase().trim() === "new price");
  const oldPriceIdx = headers.findIndex(h => h?.toString().toLowerCase().trim() === "old price");
  const discountIdx = col("discount");
  const stockIdx = col("stock");
  let customIdx = col("customization");
  if (customIdx === -1) customIdx = col("customisations");
  if (customIdx === -1) customIdx = col("customisation");
  if (customIdx === -1) customIdx = col("customization options");
  if (customIdx === -1) customIdx = headers.findIndex(h => h?.toString().toLowerCase().includes("custom"));

  // Fallback for Categories if not found but index 0 is available and itemIdx is not 0
  if (catIdx === -1 && itemIdx > 0) {
    catIdx = 0;
  }

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
    const stockStr = stockIdx !== -1 ? row[stockIdx]?.toString().trim() : undefined;
    const customStr = customIdx !== -1 ? row[customIdx]?.toString().trim() : undefined;

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
       product.options.push({ name: cleanQty, price, oldPrice: isNaN(oldPrice as number) ? undefined : oldPrice, stockStatus: stockStr });
    }

    // Add customization if present in row
    if (customStr) {
      const parsedCust = parseCustomizationCell(customStr);
      if (parsedCust) {
        if (!product.customizations) {
          product.customizations = [parsedCust];
        } else {
          const existingCust = product.customizations.find(
            (c) => c.label.toLowerCase().trim() === parsedCust.label.toLowerCase().trim()
          );
          if (!existingCust) {
            product.customizations.push(parsedCust);
          } else {
            parsedCust.options.forEach((newOpt) => {
              if (!existingCust.options.some((o) => o.value === newOpt.value)) {
                existingCust.options.push({ ...newOpt, default: false });
              }
            });
          }
        }
      }
    }
  }

  return products;
}

