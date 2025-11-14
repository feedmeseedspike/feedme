// lib/image-matcher.ts
import { imageSaver } from "@/constants/images";

export const DEFAULT_IMAGE =
  "";

export function findImageEntry(productName: string) {
  const clean = productName.trim().toLowerCase();
  return imageSaver.find((e) => e.name.trim().toLowerCase() === clean);
}

export function getProductImage(entry?: ReturnType<typeof findImageEntry>) {
  return entry?.image ?? DEFAULT_IMAGE;
}

export function getOptionImage(entry?: ReturnType<typeof findImageEntry>) {
  return entry?.image ?? DEFAULT_IMAGE;
}

// NEW: Get tags — return null if empty or missing
export function getFreshCategoryTag(categoryTitle: string): string[] | null {
  const slug = categoryTitle
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  console.log(`fresh-${slug}`)
  return slug ? [`fresh-${slug}`] : null;
}
