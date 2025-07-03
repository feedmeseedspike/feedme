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
  return <EditCategoryClient initialCategory={category} />;
}
