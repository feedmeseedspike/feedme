import { OrderItem } from "src/types";

export function mergeCartItems(localItems: OrderItem[], remoteItems: OrderItem[]): OrderItem[] {
  const merged: { [key: string]: OrderItem } = {};

  // Helper to create a unique key for each item (product + option)
  const getKey = (item: OrderItem) => `${item.product}-${item.selectedOption || ""}`;

  // Add remote items first (they take precedence)
  for (const item of remoteItems) {
    merged[getKey(item)] = { ...item };
  }

  // Merge local items
  for (const item of localItems) {
    const key = getKey(item);
    if (merged[key]) {
      // If exists, sum quantities
      merged[key].quantity += item.quantity;
    } else {
      merged[key] = { ...item };
    }
  }

  return Object.values(merged);
}