// lib/utils.ts
export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  console.log(`Slugify: "${text}" → "${slug}"`);
  return slug;
}
