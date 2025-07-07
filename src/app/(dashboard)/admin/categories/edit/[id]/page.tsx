export const dynamic = "force-dynamic";
import { getCategoryById } from "../../../../../../queries/products";
import EditCategoryClient from "./EditCategoryClient";
import { notFound } from "next/navigation";

export default async function EditCategoryPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  let category = null;
  try {
    category = await getCategoryById(id);
  } catch (err) {
    // If error or not found, show 404
    return notFound();
  }
  if (!category) {
    return notFound();
  }
  return (
    <EditCategoryClient
      initialCategory={{
        ...category,
        products: (category as any).products ?? [],
        thumbnail:
          category.thumbnail &&
          typeof category.thumbnail === "object" &&
          "url" in category.thumbnail &&
          "public_id" in category.thumbnail
            ? (category.thumbnail as { url: string; public_id: string })
            : { url: "", public_id: "" },
        description: category.description ?? "",
        keynotes: category.keynotes ?? [],
        tags: category.tags ?? [],
        banner_url: category.banner_url ?? "",
      }}
    />
  );
}
